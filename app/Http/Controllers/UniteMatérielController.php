<?php

namespace App\Http\Controllers;

use App\Models\UniteMatériel;
use App\Models\Department;
use App\Http\Requests\StoreUniteMatérielRequest;
use App\Http\Requests\UpdateUniteMatérielRequest;
use App\Http\Resources\UniteMatérielResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UniteMatérielController extends Controller
{
    public function index()
    {
        $uniteMateriels = UniteMatériel::with('department')->withCount('devices')->get();
        
        return Inertia::render('UniteMateriels/Index', [
            'uniteMateriels' => UniteMatérielResource::collection($uniteMateriels)->resolve(),
            'departments' => Department::all(),
        ]);
    }
    
    public function create()
    {
        return Inertia::render('UniteMateriels/Create', [
            'departments' => Department::all(),
        ]);
    }
    
    public function store(StoreUniteMatérielRequest $request)
    {
        $validated = $request->validated();
        
        UniteMatériel::create($validated);
        return redirect()->route('unite-materiels.index')->with('success', 'Unité Matériel créée avec succès');
    }
    
    public function show(UniteMatériel $unite_materiel)
    {
        $unite_materiel->load(['department', 'devices']);
        
        return Inertia::render('UniteMateriels/Show', [
            'uniteMatériel' => new UniteMatérielResource($unite_materiel),
        ]);
    }
    
    public function edit(UniteMatériel $unite_materiel)
    {
        return Inertia::render('UniteMateriels/Edit', [
            'uniteMatériel' => new UniteMatérielResource($unite_materiel),
            'departments' => Department::all(),
        ]);
    }
    
    public function update(UpdateUniteMatérielRequest $request, UniteMatériel $unite_materiel)
    {
        $validated = $request->validated();
        
        $unite_materiel->update($validated);
        return redirect()->back()->with('success', 'Unité Matériel mise à jour avec succès');
    }
    
    public function destroy(UniteMatériel $unite_materiel)
    {
        if ($unite_materiel->devices()->count() > 0) {
            return redirect()->back()->with('error', 'Impossible de supprimer une unité matériel contenant des appareils');
        }
        
        $unite_materiel->delete();
        return redirect()->back()->with('success', 'Unité Matériel supprimée avec succès');
    }
}
