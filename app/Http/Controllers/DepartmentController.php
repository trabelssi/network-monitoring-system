<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::withCount(['devices', 'uniteMateriels'])->get();
        
        return Inertia::render('Departments/Index', [
            'departments' => DepartmentResource::collection($departments)->resolve(),
        ]);
    }
    
    public function show(Department $department)
    {
        $department->load(['uniteMateriels.devices']);
        
        return Inertia::render('Departments/Show', [
            'department' => new DepartmentResource($department),
            'deviceStats' => [
                'total' => $department->devices()->count(),
                'online' => $department->devices()->where('is_alive', true)->count(),
            ],
        ]);
    }
    
    public function create()
    {
        return Inertia::render('Departments/Create');
    }
    
    public function store(StoreDepartmentRequest $request)
    {
        $validated = $request->validated();
        
        Department::create($validated);
        return redirect()->route('departments.index')->with('success', 'Département créé avec succès');
    }
    
    public function edit(Department $department)
    {
        return Inertia::render('Departments/Edit', [
            'department' => $department,
        ]);
    }
    
    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        $validated = $request->validated();
        
        $department->update($validated);
        return redirect()->back()->with('success', 'Département mis à jour avec succès');
    }
    
    public function destroy(Department $department)
    {
        if ($department->devices()->count() > 0) {
            return redirect()->back()->with('error', 'Impossible de supprimer un département contenant des appareils');
        }
        
        $department->delete();
        return redirect()->back()->with('success', 'Département supprimé avec succès');
    }
}
