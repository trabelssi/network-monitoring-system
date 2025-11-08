# Architecture Documentation - GLPI Sancella

## ⚠️ CLARIFICATION IMPORTANTE : ARCHITECTURE INERTIA.JS UNIQUEMENT

Ce document clarifie l'architecture réelle du projet GLPI Sancella basée exclusivement sur **Inertia.js**.

---

## 📖 Cahier des Charges du Projet

### **Partie 1 : Module de Gestion Qualité**

L'environnement de production comprend de nombreuses machines, chacune associée à un produit spécifique. Parfois, les machines introduisent des erreurs dans le processus de production. Le problème réside dans le fait que lorsqu'un produit défectueux est produit, les produits suivants peuvent également être compromis jusqu'à ce qu'une action corrective soit prise.

**Workflow Qualité :**

### **Structure du Ticket**

Un ticket représente une demande ou un signalement formalisé au sein du système, permettant d'assurer le suivi d'un incident, d'un défaut ou d'une tâche liée à une machine et à ses produits. Chaque ticket est composé d'un ensemble d'informations essentielles :

**Champs obligatoires :**
- **Nom** : Titre du ticket
- **Description** : Détail de la nature du problème
- **Machine concernée** : Équipement impliqué
- **Produits concernés** : Produits affectés
- **Utilisateur assigné** : Responsable du traitement
- **Niveau de priorité** : Évaluation de l'urgence de l'intervention
- **Date limite** : Échéance de résolution

**Champs optionnels :**
- **Image** : Illustration du défaut (optionnel)
- **Observateurs** : Utilisateurs qui suivent l'évolution sans intervenir directement

### **Statuts Automatiques du Ticket**

Le ticket est doté d'un statut dynamique qui évolue automatiquement en fonction du cycle de vie des interventions :

- **« En attente » (pending)** : Statut initial lors de la création du ticket
- **« En cours » (in process)** : Dès qu'une intervention est créée ou soumise puis rejetée
- **« Terminé » (completed)** : Lorsqu'une intervention est créée et acceptée

### **Processus Détaillé**

1. **Création de ticket** : Lorsqu'un utilisateur identifie un produit défectueux, il utilise le système pour créer une tâche (ticket) associée à la machine et au produit correspondants. L'administrateur peut également créer des tickets, mais pour ses propres tickets uniquement il a les mêmes droits qu'un utilisateur standard (création, modification, évaluation des interventions).

2. **Sélection manuelle des acteurs** : Lors de la création du ticket, l'utilisateur créateur sélectionne :
   - **Un utilisateur assigné** via le champ "Assigned User" pour résoudre le problème
   - **Un ou plusieurs observateurs** (qui peuvent être n'importe quels utilisateurs du système)
   - **Raison des observateurs** : Informer qu'il y a un problème sur une machine et des produits spécifiques

3. **Visibilité et permissions du ticket** : 
   - **Visibilité directe** : Seules ces personnes peuvent voir le ticket dans leur index personnel :
     - L'utilisateur qui a créé le ticket original
     - Les observateurs sélectionnés
     - L'utilisateur assigné
   - **Visibilité administrative** : L'administrateur peut voir tous les tickets via ses pages dédiées avec filtres
   - **Modification** : Seul l'utilisateur qui a créé le ticket original peut le modifier/éditer 

4. **Notification** : L'utilisateur assigné reçoit une notification par email et sur le tableau de bord. Les notifications sont envoyées uniquement aux utilisateurs créateurs, assignés ou observateurs du ticket.

5. **Intervention** : L'utilisateur assigné crée une intervention pour le ticket, documentant les mesures correctives prises (reconfiguration machine, tests de vérification, preuves photographiques).

6. **Notification de soumission** : Une fois l'intervention soumise, l'utilisateur qui a créé le ticket original et tous les observateurs sont notifiés.

7. **Validation** : L'utilisateur qui a créé le ticket original examine l'intervention et fournit un retour :
   - **Si approuvée** : Il peut ajouter un commentaire (optionnel)
   - **Si rejetée** : Il doit spécifier la raison du rejet et peut ajouter une image (optionnel)

8. **Résolution** : 
   - Si approuvée, le ticket est fermé et le problème est officiellement résolu
   - Si rejetée, l'utilisateur créateur spécifie la cause et demande des actions correctives supplémentaires

9. **Cycle itératif** : En cas de rejet, l'utilisateur assigné doit créer des interventions supplémentaires jusqu'à ce qu'une solution acceptable soit fournie.

10. **Supervision** : L'administrateur dispose de pages dédiées pour visualiser tous les tickets et toutes les interventions avec informations complètes, statuts, et systèmes de filtres et recherche. Les journaux d'activité montrent toutes les actions réalisées (création, modification, suppression) et permettent de naviguer directement vers les pages de tickets/interventions concernées. Il peut consulter tous les processus mais ne peut interagir directement que sur ses propres tickets et interventions. Il reçoit des notifications uniquement pour les tickets où il est créateur, assigné ou observateur, ainsi que pour tous les changements d'état des équipements réseau. Cette supervision garantit la traçabilité et la surveillance appropriée de l'ensemble du workflow de contrôle qualité.

### **Partie 2 : Module Réseau**

Le module de gestion réseau, sous contrôle de l'administrateur, complète le module de gestion en offrant une vue structurée et hiérarchique des équipements, organisés sous des Unités Matérielles et regroupés au sein de Départements.

**Architecture Hiérarchique :**
```
Département → Unité Matérielle → Équipement
```

**Découverte d'Équipements :**

1. **Protocoles utilisés** : ICMP (ping) et SNMP v2c
2. **Flux de découverte** :
   - Test ping pour vérifier l'accessibilité
   - Requête SNMP si le device répond
   - Création d'un enregistrement de découverte

**Attributs SNMP interrogés :**
- System Description (sysDescr)
- System Name (sysName) 
- System Contact (sysContact)
- System Object Identifier (sysObjectID)
- System Location (sysLocation)

**Règles d'Auto-Assignment (Contrôle Administrateur) :**

Le processus de classification repose entièrement sur les paramètres configurés par l'administrateur et utilise une approche basée sur des règles.

**Informations SNMP utilisées :**
- `snmp_available` → Indique si l'équipement répond au SNMP
- `sys_location` → Localisation physique ou logique déclarée de l'équipement
- `sys_name` → Nom du système/équipement
- `sys_contact` → Personne responsable ou contact pour l'équipement

**Processus de Classification :**

1. **Gestion des Départements** :
   - L'administrateur définit les départements (ex: Production, Administration)
   - Tout équipement avec un `sys_location` ne correspondant pas à un département existant sera placé dans "Unknown Department"

2. **Gestion des Unités Matérielles** :
   - Pour chaque département, l'administrateur crée des unités matérielles
   - Pour chaque unité, l'admin définit des mots-clés de détection basés sur `sys_name`
   - **Exemple** : Département Production → Unité "Bureautique" avec mots-clés : "pc", "laptop"
   - Les équipements dont le `sys_name` contient ces mots-clés sont automatiquement assignés à cette unité

3. **Attribution des Responsables** :
   - Le champ `sys_contact` est utilisé pour assigner la personne responsable de l'équipement
   - Assure la traçabilité de la propriété et de la responsabilité

4. **Gestion des Équipements Non-Classifiés** :
   - Les équipements ne correspondant à aucun mot-clé ou département restent non-classifiés
   - Ils demeurent en statut "unknown" jusqu'à intervention manuelle de l'admin

**Contrôle Administrateur :**
- Définition des départements existants
- Création des unités sous chaque département
- Configuration des mots-clés pour l'assignation automatique
- Gestion manuelle des équipements non-classifiés
- Ajustement des règles de classification selon les besoins

**Rôles Utilisateurs :**

**Rôles Utilisateurs :**

### **Utilisateurs (User)**

Le système distingue les utilisateurs selon leurs rôles dans la gestion des tickets et interventions :

#### **Ticket Creator (Créateur de ticket)**
- Crée des tickets pour signaler des problèmes de qualité ou production
- Sélectionne l'assigned user pour résoudre le problème
- Choisit les observateurs pour suivre l'évolution
- Valide ou rejette les interventions soumises
- Reçoit notifications sur l'évolution de ses tickets

#### **Assigned User (Utilisateur assigné)**
- Traite les tickets qui lui sont assignés
- Crée et documente les interventions correctives
- Soumet les interventions pour validation
- Reçoit notifications pour les tickets assignés

#### **Observateur**
- Suit l'évolution des tickets sans intervenir
- Reçoit notifications sur l'avancement
- Aucun droit de modification ou validation
- Permet une visibilité élargie sur les problèmes partagés

**Note importante :** Un même utilisateur peut avoir plusieurs rôles selon les tickets (créateur sur certains, assigné sur d'autres, observateur sur d'autres).

**Visualisation pour les Utilisateurs :**
- **Index tickets :** Voit uniquement ses propres tickets et ceux où il est observateur
- **Index interventions :** Voit uniquement les interventions qui le concernent (ses tickets, tickets assignés, tickets observés)
- Accès filtré selon son niveau d'implication dans chaque ticket

### **Administrateur (Admin)**

**Visualisation et Accès :**
- Dispose de pages dédiées pour voir **tous les tickets** avec informations complètes, statuts, filtres et recherche
- Dispose de pages dédiées pour voir **toutes les interventions** avec informations complètes, statuts, filtres et recherche
- Les journaux d'activité permettent de naviguer directement vers les tickets/interventions concernées
- Peut voir tous les états des tickets et interventions

**Droits sur les Tickets :**
- Peut créer et modifier uniquement ses propres tickets
- N'a pas le droit d'éditer ou supprimer les tickets des autres utilisateurs
- Ne peut modifier le statut d'un ticket que via la logique standard du workflow (créer intervention ou valider ses tickets)

**Droits sur les Interventions :**
- Ne peut pas modifier, supprimer ou évaluer les interventions des autres utilisateurs
- Peut créer ses propres interventions sur un ticket
- Si l'administrateur a créé un ticket, il peut évaluer/noter les interventions soumises pour ce ticket
- Seulement ses propres interventions peuvent être modifiées par lui

**Gestion des Utilisateurs :**
- Peut changer le rôle d'un utilisateur (promouvoir en admin ou maintenir comme utilisateur standard)
- Gestion complète des comptes utilisateurs

**Module Réseau :**
- **Gestion exclusive** (découverte, départements, unités, équipements)
- **Seul accès** aux tableaux de bord et historiques réseau

**Notifications :**
- **Tickets :** Reçoit notifications UNIQUEMENT pour les tickets où il est créateur/assigné/observateur
- **Réseau :** Reçoit TOUTES les notifications d'état des équipements réseau

**Résumé :** L'administrateur a une visualisation complète de tous les tickets et interventions via des pages dédiées avec filtres, mais ne peut interagir directement que sur ses propres éléments, et peut gérer les rôles utilisateurs.

---

## 🏗️ Architecture Réelle Implémentée

### 1. **Architecture Monolithique Inertia.js**

Notre projet utilise une **architecture monolithique moderne** basée sur Inertia.js qui combine :

- **Frontend** : React 18 avec Inertia.js comme framework principal
- **Backend** : Laravel 11 avec contrôleurs Inertia
- **Communication** : Routes web retournant exclusivement des réponses Inertia

### 2. **Structure de Communication**

```
Frontend (React Components)
    ↕️ (Inertia.js Protocol)
Backend (Laravel Controllers)
    ↕️ (Services Layer)
Business Logic (DeviceDiscoveryService, AutoAssignmentService)
    ↕️ (Eloquent ORM)
Database (MySQL)
```

---

## 📋 Ce que nous utilisons EXACTEMENT

### **Routes Web Inertia Exclusivement**
**Fichier :** `routes/web.php`

```php
// Toutes les routes retournent des réponses Inertia
Route::get('/discovery', [DeviceDiscoveryController::class, 'index'])->name('discovery.index');
Route::get('/network/dashboard', [NetworkDashboardController::class, 'index'])->name('network.dashboard');
Route::get('/network/department/{department}', [NetworkDashboardController::class, 'getDevicesByDepartment'])->name('network.department');
Route::get('/network/subnet/{subnet}', [NetworkDashboardController::class, 'getSubnetDetails'])->name('network.subnet');

// Opérations réseau via Inertia forms
Route::post('/discovery/single-ip', [DeviceDiscoveryController::class, 'discoverSingleIP']);
Route::post('/discovery/subnet', [DeviceDiscoveryController::class, 'discoverSubnet']);
```

### **Contrôleurs Inertia Purs**
**Fichiers :** `app/Http/Controllers/DeviceDiscoveryController.php`, `app/Http/Controllers/NetworkDashboardController.php`

Ces contrôleurs :
- Retournent exclusivement des **réponses Inertia** avec `Inertia::render()`
- Passent les données via les props Inertia
- Utilisent les services métier pour la logique business

**Contrôleurs Gestion Qualité :**
- `ProjectController` : Gestion des projets/machines
- `TaskController` : Gestion des tickets qualité
- `InterventionController` : Gestion des interventions techniques
- `UserController` : Gestion des utilisateurs (Admin + User)

**Contrôleurs Réseau :**
- `DeviceDiscoveryController` : Découverte et classification des équipements
- `NetworkDashboardController` : Tableaux de bord et statistiques réseau
- `DeviceController` : CRUD des équipements découverts

### **Services Métier**
**Fichiers :** `app/Services/DeviceDiscoveryService.php`, `app/Services/AutoAssignmentService.php`

**Services Réseau :**
- `DeviceDiscoveryService` : Gestion des protocoles SNMP/ICMP
- `AutoAssignmentService` : Classification basée sur les règles configurées par l'administrateur
- `PingService` : Tests de connectivité ICMP

**Services Gestion :**
- Encapsulent la logique métier des tickets et interventions
- Gèrent les notifications email et dashboard
- Orchestrent les workflows qualité

**Fonctionnalités :**
- Gèrent les protocoles réseau (SNMP v2c, ICMP)
- Retournent des données structurées aux contrôleurs
- Implémentent les règles métier de Sancella

### **Frontend React avec Inertia.js**
**Dossier :** `resources/js/`

**Pages Gestion Qualité :**
- `Dashboard.jsx` : Tableau de bord qualité uniquement (User + Admin)
- `Project/` : Pages de gestion des projets/machines (User + Admin)
- `Intervention/` : Interface des interventions techniques (User Production + Admin)
- `User/` : Gestion des utilisateurs (Admin uniquement)
- `Admin/Tickets/` : Index complet de tous les tickets avec filtres (Admin uniquement)
- `Admin/Interventions/` : Index complet de toutes les interventions avec filtres (Admin uniquement)

**Pages Réseau :**
- `Network/Dashboard.jsx` : Tableau de bord réseau (Admin exclusivement)
- `Device/` : Gestion des équipements découverts (Admin exclusivement)
- `DeviceHistory/` : Historique des statuts (Admin exclusivement)
- `Departments/` et `UniteMateriels/` : Structure organisationnelle (Admin exclusivement)

**Composants communs :**
- `resources/js/Components/` : UI réutilisables
- `resources/js/Layouts/` : Structure des pages

---

## ❌ Ce que nous N'UTILISONS PAS

### **Aucune API ou Communication JSON**

❌ **Fichier `routes/api.php`** : N'existe pas dans notre projet
❌ **Contrôleurs dédiés API** : Pas de dossier `app/Http/Controllers/Api/`
❌ **Réponses JSON** : Aucune réponse `response()->json()`
❌ **Requêtes AJAX/Fetch** : Communication uniquement via Inertia
❌ **Endpoints séparés** : Toutes les fonctionnalités via Inertia forms et links

---

## 🎯 Pourquoi Cette Architecture ?

### **Avantages de l'architecture Inertia.js pure :**

1. **Simplicité absolue**
   - Une seule technologie de communication (Inertia)
   - Authentification unifiée Laravel
   - Gestion d'état native React avec props Inertia

2. **Performance maximale**
   - Pas de requêtes multiples
   - Hydratation côté serveur optimale
   - Communication Inertia ultra-rapide

3. **Maintenabilité excellente**
   - Architecture monolithique cohérente
   - Services métier découplés
   - Tests simplifiés avec Inertia

4. **Sécurité renforcée**
   - Session Laravel exclusive
   - CSRF protection automatique
   - Aucune exposition externe

---

## 🔗 Pages et Fonctionnalités Inertia

### **Module Gestion Qualité**
```
GET  /dashboard                   → Tableau de bord qualité (Inertia) - User + Admin
GET  /projects                    → Gestion des projets/machines (Inertia) - User + Admin
GET  /interventions               → Liste des interventions (Inertia) - User + Admin
POST /interventions               → Création intervention via Inertia form - User + Admin
GET  /user-dashboard              → Dashboard utilisateur (Inertia) - User + Admin
```

### **Module Réseau (Admin exclusivement)**
```
GET  /discovery                   → Page découverte d'équipements (Inertia) - Admin uniquement
GET  /network/dashboard           → Tableau de bord réseau (Inertia) - Admin uniquement
GET  /network/department/{id}     → Vue département (Inertia) - Admin uniquement
GET  /devices                     → Gestion équipements (Inertia) - Admin uniquement
GET  /device-history              → Historique des statuts (Inertia) - Admin uniquement
```

### **Actions via Inertia Forms**
```
POST /discovery/single-ip         → Scan IP via Inertia form
POST /discovery/subnet            → Scan sous-réseau via Inertia form
POST /discovery/auto-assignment   → Auto-assignment via Inertia form
POST /projects                    → Création projet via Inertia form
POST /interventions               → Soumission intervention via Inertia form
```

### **Navigation via Inertia Links**
```
Tous les liens utilisent <Link> d'Inertia
Toute la navigation se fait via Inertia.visit()
Aucune requête AJAX manuelle
Gestion d'état unifiée via props Inertia
```

---

## 📊 Technologies Utilisées

### **Frontend**
- **React 18** : Composants UI modernes
- **Inertia.js 2.0** : Framework frontend/backend unifié
- **TailwindCSS** : Framework CSS utilitaire
- **Heroicons** : Icônes SVG
- **Vite** : Build tool moderne

### **Backend**
- **Laravel 11** : Framework PHP
- **PHP 8.2** : Langage serveur
- **Eloquent ORM** : Accès données
- **Services Layer** : Logique métier

### **Base de Données**
- **MySQL 8.0** : Base de données relationnelle
- **Migrations Laravel** : Gestion du schéma
- **Seeders** : Données de test

### **Protocoles Réseau**
- **SNMP v2c** : Collecte informations équipements (snmp_available, sys_location, sys_name, sys_contact)
- **ICMP (Ping)** : Test de connectivité réseau
- **Services dédiés** : Classification basée sur les règles administrateur avec gestion des équipements non-classifiés

### **Gestion Qualité**
- **Workflow tickets** : Création → Attribution → Intervention → Validation
- **Système de notifications** : Email + Dashboard
- **Gestion des rôles** : 
  - **User (Ticket Creator)** : Création tickets, validation interventions - **Aucun accès module réseau**
  - **User (Assigned User)** : Création interventions, traitement tickets assignés - **Aucun accès module réseau**
  - **Admin** : Toutes les fonctionnalités + supervision globale + **Accès exclusif module réseau**
- **Traçabilité complète** : Audit des actions et interventions

---

## 🎓 Pour Votre Rapport Académique

### **Terminologie Correcte à Utiliser :**

✅ **"Architecture monolithique Inertia.js"**
✅ **"Application full-stack avec Inertia.js"**
✅ **"Communication exclusive via protocole Inertia"**
✅ **"Interface utilisateur React-Inertia intégrée"**
✅ **"Système de gestion qualité et réseau unifié"**
✅ **"Workflow tickets avec attribution manuelle et découverte SNMP des équipements"**

### **Terminologie à Éviter :**

❌ **"API REST"**
❌ **"Endpoints JSON"**
❌ **"Communication AJAX"**
❌ **"Architecture hybride"**
❌ **"Services JSON"**

---

## 🔍 Clarifications Importantes

### **Workflow des Tickets vs Découverte SNMP**

**IMPORTANT :** Le protocole SNMP et l'auto-assignment ne concernent **EXCLUSIVEMENT** que :
- La découverte des équipements réseau
- La classification automatique des devices selon les règles administrateur
- L'attribution des équipements aux départements et unités matérielles

**Le workflow des tickets de qualité est entièrement manuel :**
- Attribution manuelle des utilisateurs assignés
- Sélection manuelle des observateurs  
- Aucune relation automatique entre tickets et équipements réseau
- Les corrélations machine-device sont vérifiées manuellement par l'administrateur

### **Accès Module Réseau**

**Accès EXCLUSIF Administrateur :**
- Découverte et gestion des équipements
- Tableaux de bord réseau
- Historique des statuts devices
- Configuration départements/unités

**Utilisateurs (Qualité/Production) :**
- AUCUN accès aux fonctionnalités réseau
- Gestion tickets uniquement
- Pas de visibilité sur les équipements découverts

### **Notifications Administrateur**

**Pour les tickets :** Reçoit notifications UNIQUEMENT s'il est créateur/assigné/observateur
**Pour le réseau :** Reçoit TOUTES les notifications d'état des équipements réseau
**Pas de notifications automatiques** pour tous les tickets créés par d'autres utilisateurs

---

## 🏁 Conclusion

Notre architecture représente une **solution monolithique moderne et cohérente** qui :

- Utilise exclusivement Inertia.js pour toute la communication frontend/backend
- Intègre efficacement la gestion qualité et le monitoring réseau
- Implémente un workflow complet de tickets avec découverte automatique d'équipements
- Offre des performances optimales sans complexité API
- Maintient une architecture simple et parfaitement maintenable
- Répond efficacement aux besoins spécifiques de production et réseau de Sancella

Cette approche Inertia.js pure est particulièrement adaptée aux applications d'entreprise industrielles où la simplicité, la cohérence architecturale, la traçabilité et la sécurité sont prioritaires. Grâce aux journaux d'activité, l'administrateur peut vérifier si une machine en panne correspond à un device déconnecté ou en erreur, afin d'identifier rapidement la cause et agir efficacement.
