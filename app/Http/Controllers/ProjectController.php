<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Product;
use App\Models\User;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;
use App\Models\Task;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $query = Project::query()
            ->with(['createdBy:id,name', 'products:id,name,project_id'])
            ->withCount(['products']);
    
        $sortField = request("sort_field", 'created_at');
        $sortDirection = request("sort_direction", 'desc');
    
        if (request()->has("name")) {
            $query->where("name", "like", "%" . request("name") . "%");
        }
        if (request()->has("reference")) {
            $query->where("reference", "like", "%" . request("reference") . "%");
        }
    
        $projects = $query->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->onEachSide(1)
            ->withQueryString();
    
        return inertia("Project/Index", [
            "projects" => ProjectResource::collection($projects),
            'queryParams' => request()->query() ?: null,
            'success' => session('success'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia("Project/Create", [
            'users' => User::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProjectRequest $request)
    {
        try {
            $data = $request->validated();

            if ($request->hasFile('image')) {
                $data['image_path'] = $request->file('image')->store('projects', 'public');
            }

            // Clean and format members
            if (isset($data['members'])) {
                $memberIds = array_filter(array_map('trim', explode(',', $data['members'])));
                $data['members'] = implode(',', $memberIds);
            }

            // Set created_by and updated_by
            $data['created_by'] = Auth::id();
            $data['updated_by'] = Auth::id();

            // Remove products from data array as it's not a column
            $products = $data['products'] ?? [];
            unset($data['products']);

            $project = Project::create($data);

            // Create products for this project
            foreach ($products as $productName) {
                $productName = trim($productName);
                if (!empty($productName)) {
                    Product::create([
                        'name' => $productName,
                        'project_id' => $project->id
                    ]);
                }
            }

            // Log project creation with all details
            try {
                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'create_project',
                    'description' => "Création de la machine: {$project->name}",
                    'model_type' => 'Project',
                    'model_id' => $project->id,
                    'properties' => [
                        'project_name' => $project->name,
                        'description' => $project->description,
                        'members' => $project->members,
                        'created_by' => Auth::user()->name,
                        'created_at' => now()->format('Y-m-d H:i:s'),
                    ],
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to log project creation', [
                    'project_id' => $project->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return redirect()->route('projects.index')
                    ->with('success', 'Machine créée avec succès.');

        } catch (\Exception $e) {
            Log::error('Project creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'error' => 'Une erreur est survenue lors de la création de la machine. Veuillez réessayer.'
            ])->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project)
    {
        // Get all tasks associated with this project's products
        $query = Task::query()
            ->whereHas('products', function($query) use ($project) {
                $query->where('project_id', $project->id);
            })
            ->with([
                'products' => function($query) use ($project) {
                    $query->where('project_id', $project->id)
                        ->select('products.id', 'products.name', 'products.project_id');
                },
                'assignedUser:id,name',
                'createdBy:id,name',
                'updatedBy:id,name',
                'interventions' => function($query) {
                    $query->latest();
                }
            ]);

         $sortField = request("sort_field", 'created_at');
        $sortDirection = request("sort_direction", 'desc');
    
        if (request()->has("name")) {
            $query->where("name", "like", "%" . request("name") . "%");
        }
    
        $tasks = $query->orderBy($sortField, $sortDirection)
            ->paginate(10)
            ->onEachSide(1)
            ->withQueryString();

        // Update task statuses based on interventions
        $tasks->each(function ($task) {
            $task->status = $task->determineStatus();
        });

        // Load the project with its products
        $project->load(['products' => function($query) {
            $query->select('id', 'name', 'project_id');
        }, 'createdBy:id,name']);

        return inertia("Project/Show", [
            "project" => new ProjectResource($project),
            "tasks" => TaskResource::collection($tasks),
            'queryParams' => request()->query() ?: null,
            'success' => session('success'),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Project $project)
    {
        return inertia('Project/Edit', [
            'project' => new ProjectResource($project->load(['products', 'createdBy:id,name'])),
            'users' => User::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project)
    {
        try {
            DB::beginTransaction();
            
            $data = $request->validated();

            // Handle image upload first
            if ($request->hasFile('image')) {
                try {
                    $image = $request->file('image');
                    
                    // Delete old image if exists
                    if ($project->image_path) {
                        Storage::disk('public')->delete($project->image_path);
                    }
                    
                    // Store new image
                    $imagePath = $image->store('projects/' . $project->id, 'public');
                    
                    if (!$imagePath) {
                        throw new \Exception('Failed to store image');
                    }
                    
                    $data['image_path'] = $imagePath;
                    
                    Log::info('Project image updated successfully', [
                        'project_id' => $project->id,
                        'new_image_path' => $imagePath
                    ]);
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Image upload failed', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return back()->withErrors(['image' => 'Failed to upload image. Please try again.']);
                }
            }

            // Clean and format members
            if (isset($data['members'])) {
                $memberIds = array_filter(array_map('trim', explode(',', $data['members'])));
                $data['members'] = implode(',', $memberIds);
            }

            // Set updated_by
            $data['updated_by'] = Auth::id();

            // Remove products from data to handle separately
            $products = $data['products'] ?? [];
            unset($data['products']);

            // Update project
            $project->update($data);

            // Update products
            if (is_array($products)) {
                // Get existing product names
                $existingProducts = $project->products()->pluck('name', 'id')->toArray();
                $existingNames = array_values($existingProducts);
                
               
                
                // Find products to delete (those that are not in the new list)
                $productsToDelete = array_filter($existingProducts, function($name) use ($products) {
                    return !in_array(trim($name), array_map('trim', $products));
                });
                
                // Delete only products that are not in the new list
                if (!empty($productsToDelete)) {
                    Log::info('Deleting removed products', [
                        'project_id' => $project->id,
                        'products_to_delete' => $productsToDelete
                    ]);
                    
                    $project->products()
                        ->whereIn('name', array_values($productsToDelete))
                        ->delete();
                }
                
                // Add only new products
                $addedProducts = [];
                foreach ($products as $productName) {
                    $productName = trim($productName);
                    if (!empty($productName) && !in_array($productName, $existingNames)) {
                        $newProduct = $project->products()->create(['name' => $productName]);
                        $addedProducts[] = $newProduct->name;
                    }
                }
                
                if (!empty($addedProducts)) {
                    Log::info('Added new products', [
                        'project_id' => $project->id,
                        'added_products' => $addedProducts
                    ]);
                }
            }

            // Log the update
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'update_project',
                'description' => "Mise à jour de la machine: {$project->name}",
                'model_type' => 'Project',
                'model_id' => $project->id,
                'properties' => [
                    'project_name' => $project->name,
                    'description' => $project->description,
                    'members' => $project->members,
                    'products' => $products,
                    'updated_by' => Auth::user()->name,
                    'updated_at' => now()->format('Y-m-d H:i:s'),
                    'has_new_image' => $request->hasFile('image'),
                ],
            ]);

            DB::commit();

            return redirect()->route('projects.index')
                ->with('success', 'La machine a été mise à jour avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Project update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->except(['image'])
            ]);
            return back()->withErrors(['error' => 'Une erreur est survenue lors de la mise à jour de la machine.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project)
    {
        $name = $project->name;
        
        // Delete associated image directory if exists
        if ($project->image_path) {
            Storage::disk('public')->deleteDirectory(dirname($project->image_path));
        }

        // Delete associated products before deleting project
        $project->products()->delete();
        
        $project->delete();

        return to_route("projects.index")->with("success", "Projet \"$name\" a été supprimé avec succès");
    }
}
