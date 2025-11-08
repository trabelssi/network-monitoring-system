# GLPI Website Style Guide

## Table of Contents
1. [Design System Overview](#design-system-overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Layout & Spacing](#layout--spacing)
5. [Header Components](#header-components)
6. [Card Components](#card-components)
7. [Button Components](#button-components)
8. [Form Components](#form-components)
9. [Table Components](#table-components)
10. [Status Badges](#status-badges)
11. [Icons & Heroicons](#icons--heroicons)
12. [Advanced Animations & Effects](#advanced-animations--effects)
13. [Loading States & Transitions](#loading-states--transitions)
14. [Interactive Elements](#interactive-elements)
15. [Responsive Design](#responsive-design)
16. [Component Examples](#component-examples)
17. [Animation Implementation](#animation-implementation)
18. [Animation Best Practices & Troubleshooting](#animation-best-practices--troubleshooting)

## Design System Overview

This website uses a **dark theme** with **glass-morphism effects** and **gradient accents**. The design emphasizes:
- Dark backgrounds with transparency (`bg-black/40`)
- Backdrop blur effects (`backdrop-blur-lg`)
- Gradient color schemes
- Smooth animations and transitions
- Consistent spacing and typography
- Modern, professional appearance
- **Advanced interactive animations**
- **Loading states and progressive reveals**
- **Micro-interactions and hover effects**

## Color Palette

### Primary Colors
```css
/* Dark backgrounds with transparency */
bg-black/40          /* Main card backgrounds */
bg-black/20          /* Secondary backgrounds */
bg-black/10          /* Subtle backgrounds */

/* White borders and accents */
border-white/10      /* Main borders */
border-white/20      /* Stronger borders */
border-white/30      /* Status badge borders */
```

### Gradient Colors
```css
/* Primary gradients */
from-cyan-500 to-blue-500      /* Main accent */
from-slate-900/90 via-slate-800/90 to-slate-900/90  /* Header background */

/* Status gradients */
from-green-500 to-emerald-500  /* Success/Online */
from-red-500 to-pink-500       /* Error/Offline */
from-yellow-500 to-orange-500  /* Warning/Unknown */
from-purple-500 to-violet-500  /* Auto-assigned */
from-indigo-500 to-blue-500    /* Departments */
from-teal-500 to-cyan-500      /* Equipment */
```

### Text Colors
```css
text-white           /* Primary headings */
text-gray-400        /* Secondary text */
text-gray-500        /* Tertiary text */
text-gray-600        /* Subtle text */
text-cyan-400        /* Accent text */
text-green-400       /* Success text */
text-red-400         /* Error text */
text-yellow-400      /* Warning text */
text-purple-400      /* Purple accent */
text-indigo-400      /* Indigo accent */
text-teal-400        /* Teal accent */
```

## Typography

### Font Weights
```css
font-bold            /* Main headings */
font-semibold        /* Section headings */
font-medium          /* Important text */
font-normal          /* Body text */
```

### Font Sizes
```css
text-2xl             /* Main page titles */
text-lg              /* Section headings */
text-base            /* Body text */
text-sm              /* Secondary text */
text-xs              /* Small text, badges */
```

## Layout & Spacing

### Container Layouts
```css
/* Main container */
max-w-7xl mx-auto sm:px-6 lg:px-8

/* Page padding */
py-6                 /* Vertical page padding */
py-12                /* Alternative vertical padding */

/* Section spacing */
space-y-6            /* Vertical spacing between sections */
space-y-8            /* Alternative vertical spacing */
```

### Grid Systems
```css
/* Responsive grids */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4    /* 4-column stats */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3    /* 3-column layout */
grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3    /* Department cards */

/* Gap spacing */
gap-4                /* Small gaps */
gap-6                /* Medium gaps */
gap-8                /* Large gaps */
```

## Header Components

### Main Page Header (Glitch-Free Version)
```jsx
<div className="flex justify-between items-center bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-xl">
    <div className="flex items-center gap-3">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
            <IconName className="h-8 w-8 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-400">Section Description</p>
            <h2 className="text-2xl font-bold text-white">Page Title</h2>
        </div>
    </div>
    <div className="flex space-x-3">
        {/* Action buttons */}
    </div>
</div>
```

### Header Icon Container (Glitch-Free Version)
```jsx
<div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg">
    <IconName className="h-8 w-8 text-white" />
</div>
```

## Card Components

### Enhanced Interactive Card Container (Glitch-Free Version)
```jsx
<div 
    className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer ${
        hoveredCard === 'cardId' ? 'ring-2 ring-cyan-500/50' : ''
    }`}
    onMouseEnter={() => setHoveredCard('cardId')}
    onMouseLeave={() => setHoveredCard(null)}
>
    {/* Card content */}
</div>
```

### Main Card Container (Glitch-Free Version)
```jsx
<div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-black/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer">
    {/* Card content */}
</div>
```

### Secondary Card Container (Glitch-Free Version)
```jsx
<div className="bg-black/20 border border-white/10 rounded-lg p-4 hover:bg-black/30 hover:shadow-lg transition-all duration-500 transform hover:scale-105 cursor-pointer backdrop-blur-sm">
    {/* Card content */}
</div>
```

### Section Container (Glitch-Free Version)
```jsx
<div className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden">
    <div className="p-6">
        {/* Section content */}
    </div>
</div>
```

## Button Components

### Enhanced Primary Button (Glitch-Free Version)
```jsx
<Link
    href={route('route.name')}
    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
>
    <IconName className="w-5 h-5" />
    Button Text
</Link>
```

### Primary Button (Glitch-Free Version)
```jsx
<Link
    href={route('route.name')}
    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
>
    <IconName className="w-5 h-5" />
    Button Text
</Link>
```

### Secondary Button (Glitch-Free Version)
```jsx
<Link
    href={route('route.name')}
    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300"
>
    <IconName className="w-5 h-5" />
    Button Text
</Link>
```

### Warning Button (Glitch-Free Version)
```jsx
<Link
    href={route('route.name')}
    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
>
    Button Text
</Link>
```

## Form Components

### Text Input
```jsx
<TextInput 
    className="w-full bg-black/40 border border-white/10 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" 
    defaultValue={value}
    placeholder="Placeholder text..."
    onChange={handleChange}
    icon={<IconName className="w-5 h-5 text-gray-400" />}
/>
```

### Search Section
```jsx
<div className="p-4 bg-black/20 border-b border-white/10">
    <div className="flex gap-4">
        <div className="flex-1">
            {/* Search inputs */}
        </div>
    </div>
</div>
```

## Table Components

### Enhanced Table Container (Glitch-Free Version)
```jsx
<div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-black/20">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {/* Header content */}
                </th>
            </tr>
        </thead>
        <tbody className="bg-transparent divide-y divide-white/10">
            <tr 
                className="hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
            >
                {/* Row content */}
            </tr>
        </tbody>
    </table>
</div>
```

### Table Container (Glitch-Free Version)
```jsx
<div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-black/20">
            <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    {/* Header content */}
                </th>
            </tr>
        </thead>
        <tbody className="bg-transparent divide-y divide-white/10">
            <tr className="hover:bg-white/5 transition-colors duration-200">
                {/* Row content */}
            </tr>
        </tbody>
    </table>
</div>
```

### Table Header
```jsx
<th className="px-6 py-3 text-left">
    <div className="flex items-center gap-2 text-gray-400">
        <IconName className="w-4 h-4" />
        Header Text
    </div>
</th>
```

## Status Badges

### Enhanced Status Badge Base (Glitch-Free Version)
```jsx
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300">
    Badge Text
</span>
```

### Status Badge Base
```jsx
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
    Badge Text
</span>
```

### Status Badge Variants
```jsx
{/* Success/Online */}
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
    Online
</span>

{/* Error/Offline */}
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
    Offline
</span>

{/* Warning/Unknown */}
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
    Unknown
</span>

{/* Info/Auto */}
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
    Auto
</span>
```

## Icons & Heroicons

### Heroicons Version
This project uses **Heroicons v2** with the **24x24 outline variant**.

### Icon Import Pattern
```jsx
import { 
    IconName1,
    IconName2,
    IconName3
} from '@heroicons/react/24/outline';
```

### Common Icons Used
```jsx
// Navigation & Actions
WrenchIcon          // Tools, management
PlusIcon            // Add new items
PencilSquareIcon    // Edit
TrashIcon           // Delete
EyeIcon             // View details
MagnifyingGlassIcon // Search

// Status & Indicators
CheckCircleIcon     // Success, online
XCircleIcon         // Error, offline
ExclamationTriangleIcon // Warning, unknown

// Categories
ComputerDesktopIcon // Devices, computers
BuildingOfficeIcon  // Departments, buildings
CpuChipIcon        // Hardware, auto-assigned
GlobeAltIcon       // Network, global
ChartBarIcon       // Dashboard, analytics
UserIcon           // Users, people
CalendarIcon       // Dates, time
HashtagIcon        // References, IDs

// New Enhanced Icons
ArrowTrendingUpIcon    // Upward trends, growth
ArrowTrendingDownIcon  // Downward trends, decline
BoltIcon               // Action required, fast
SignalIcon             // Status, connectivity
```

### Icon Sizing
```css
h-8 w-8            /* Header icons */
h-6 w-6            /* Card icons */
h-5 w-5            /* Button icons */
h-4 w-4            /* Table icons */
```

### Enhanced Icon Container Styling (Glitch-Free Version)
```jsx
{/* Primary icon container with hover effects */}
<div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-lg shadow-lg transition-all duration-300 transform hover:rotate-12">
    <IconName className="h-6 w-6 text-white" />
</div>

{/* Status-specific icon containers */}
<div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
    <CheckCircleIcon className="h-6 w-6 text-white" />
</div>

{/* Animated icon containers - use sparingly */}
<div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
    <ExclamationTriangleIcon className="h-6 w-6 text-white" />
</div>
```

## Advanced Animations & Effects

### Enhanced Transition Classes (Glitch-Free Version)
```css
transition-all duration-500      /* Enhanced transitions */
transition-all duration-300      /* Standard transition */
transition-colors duration-200  /* Color-only transition */
transition-shadow duration-300   /* Shadow transition */
```

### Advanced Hover Effects (Glitch-Free Version)
```css
hover:scale-105                 /* Card scale on hover */
hover:scale-[1.02]              /* Subtle table row scale */
hover:bg-black/50               /* Card hover */
hover:bg-black/30               /* Secondary card hover */
hover:shadow-2xl                /* Enhanced shadow on hover */
hover:shadow-cyan-500/20        /* Color-tinted shadows */
hover:shadow-green-500/20       /* Green-tinted shadows */
hover:shadow-red-500/20         /* Red-tinted shadows */
hover:shadow-purple-500/20      /* Purple-tinted shadows */
hover:shadow-indigo-500/20      /* Indigo-tinted shadows */
hover:shadow-teal-500/20        /* Teal-tinted shadows */
hover:from-cyan-600 hover:to-blue-600  /* Button gradient hover */
hover:text-cyan-400             /* Text hover */
hover:bg-white/5                /* Table row hover */
hover:rotate-12                 /* Icon rotation on hover */
```

### Advanced Animation Classes (Glitch-Free Version)
```css
animate-spin                     /* Loading spinner - use only for loading states */
backdrop-blur-lg                /* Glass effect */
backdrop-blur-sm                /* Subtle glass effect */
```

### Interactive Ring Effects (Glitch-Free Version)
```jsx
{/* Dynamic ring highlighting */}
<div className={`card-container ${
    hoveredCard === 'cardId' ? 'ring-2 ring-cyan-500/50' : ''
}`}>
    {/* Card content */}
</div>
```

## Loading States & Transitions

### Full-Screen Loading State (Glitch-Free Version)
```jsx
if (isLoading) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <div className="text-2xl font-semibold text-white">Loading Dashboard...</div>
                    <div className="text-gray-400 mt-2">Discovering devices and analyzing network topology</div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### Progressive Loading (Glitch-Free Version)
```jsx
// Simple loading state management
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 300); // Short delay for smooth transition
    return () => clearTimeout(timer);
}, []);
```

## Interactive Elements

### Enhanced Card Interactions (Glitch-Free Version)
```jsx
const [hoveredCard, setHoveredCard] = useState(null);

<div 
    className={`card-container ${
        hoveredCard === 'cardId' ? 'ring-2 ring-cyan-500/50' : ''
    }`}
    onMouseEnter={() => setHoveredCard('cardId')}
    onMouseLeave={() => setHoveredCard(null)}
>
    {/* Card content */}
</div>
```

### Enhanced Status Indicators (Glitch-Free Version)
```jsx
{/* Enhanced status with context */}
<div className="mt-3 flex items-center text-sm text-cyan-400">
    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
    <span>Active Network</span>
</div>

<div className="mt-3 flex items-center text-sm text-green-400">
    <SignalIcon className="h-4 w-4 mr-1" />
    <span>Healthy</span>
</div>

<div className="mt-3 flex items-center text-sm text-red-400">
    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
    <span>Needs Attention</span>
</div>

<div className="mt-3 flex items-center text-sm text-yellow-400">
    <BoltIcon className="h-4 w-4 mr-1" />
    <span>Action Required</span>
</div>
```

### Enhanced Progress Bars (Glitch-Free Version)
```jsx
{/* Animated health indicator */}
<div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
    <div 
        className={`h-2 rounded-full transition-all duration-1000 ease-out ${
            health_percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
            health_percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
            'bg-gradient-to-r from-red-500 to-pink-500'
        }`}
        style={{ 
            width: '0%',
            animation: `progressBar 1.5s ease-out forwards`
        }}
    ></div>
</div>
```

## Responsive Design

### Breakpoint System
```css
/* Mobile first approach */
grid-cols-1                     /* 1 column on mobile */
md:grid-cols-2                 /* 2 columns on medium screens */
lg:grid-cols-3                 /* 3 columns on large screens */
xl:grid-cols-4                 /* 4 columns on extra large screens */
```

### Responsive Spacing
```css
py-6                           /* Mobile padding */
sm:px-6                        /* Small screen horizontal padding */
lg:px-8                        /* Large screen horizontal padding */
```

### Responsive Grids
```css
/* Stats grid */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4

/* Department cards */
grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3

/* Network topology */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

## Component Examples

### Enhanced Stat Card with Interactions (Glitch-Free Version)
```jsx
<div 
    className={`bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-500 transform hover:scale-105 hover:bg-black/50 hover:shadow-2xl hover:shadow-cyan-500/20 cursor-pointer ${
        hoveredCard === 'total' ? 'ring-2 ring-cyan-500/50' : ''
    }`}
    onMouseEnter={() => setHoveredCard('total')}
    onMouseLeave={() => setHoveredCard(null)}
>
    <div className="flex items-center">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg mr-3 transition-all duration-300 transform hover:rotate-12">
            <ComputerDesktopIcon className="h-6 w-6 text-white" />
        </div>
        <div>
            <div className="text-2xl font-bold text-white transition-all duration-300">
                {stats.total_devices}
            </div>
            <div className="text-gray-400">Total Devices</div>
        </div>
    </div>
    <div className="mt-3 flex items-center text-sm text-cyan-400">
        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
        <span>Active Network</span>
    </div>
</div>
```

### Complete Enhanced Action Button (Glitch-Free Version)
```jsx
<Link
    href={route('devices.index')}
    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
>
    <WrenchIcon className="w-5 h-5" />
    Manage Devices
</Link>
```

### Enhanced Table Row (Glitch-Free Version)
```jsx
<tr 
    className="hover:bg-white/5 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
        Device Name
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
        192.168.1.100
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/30 transition-all duration-300">
            Online
        </span>
    </td>
</tr>
```

## Animation Implementation

### Custom CSS Keyframes (Use Sparingly)
```jsx
{/* Only use custom CSS when absolutely necessary */}
<style>{`
    @keyframes progressBar {
        from { width: 0%; }
        to { width: var(--target-width); }
    }
`}</style>
```

### Animation State Management (Glitch-Free Version)
```jsx
const [isLoading, setIsLoading] = useState(true);
const [hoveredCard, setHoveredCard] = useState(null);

useEffect(() => {
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 300); // Keep delays short
    return () => clearTimeout(timer);
}, []);
```

## Animation Best Practices & Troubleshooting

### ❌ **AVOID These Animation Patterns (Causes Glitches):**

```jsx
// ❌ DON'T: Mix multiple animation classes
<div className="animate-fade-in animate-fade-in-up animate-pulse">
    {/* This causes conflicts */}
</div>

// ❌ DON'T: Use complex animation delays
style={{ animationDelay: `${800 + index * 100}ms` }}

// ❌ DON'T: Combine conflicting animations
<div className="animate-fade-in-up animation-delay-200 animate-pulse">
    {/* This causes double animations */}
</div>

// ❌ DON'T: Use custom CSS with Tailwind animations
<style>{`
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
    .animation-delay-100 { animation-delay: 100ms; }
`}</style>
```

### ✅ **USE These Glitch-Free Patterns:**

```jsx
// ✅ DO: Use simple loading states
const [isLoading, setIsLoading] = useState(true);

// ✅ DO: Use smooth transitions
<div className="transition-all duration-300 transform hover:scale-105">

// ✅ DO: Use hover effects
<div className="hover:bg-black/50 hover:shadow-lg">

// ✅ DO: Use interactive states
<div className={`${hoveredCard === 'id' ? 'ring-2 ring-cyan-500/50' : ''}`}>

// ✅ DO: Use backdrop blur for glass effects
<div className="backdrop-blur-lg bg-black/40">
```

### 🔧 **Common Animation Issues & Solutions:**

#### **Issue 1: Double Animation Glitch**
```jsx
// ❌ Problem: Multiple animation classes
<div className="animate-fade-in animate-fade-in-up">

// ✅ Solution: Use only one animation or none
<div className="animate-fade-in">
// OR
<div className=""> // No animation class
```

#### **Issue 2: Animation Delay Conflicts**
```jsx
// ❌ Problem: Complex delay calculations
style={{ animationDelay: `${800 + index * 100}ms` }}

// ✅ Solution: Remove delays, use simple transitions
<div className="transition-all duration-300">
```

#### **Issue 3: Custom CSS Conflicts**
```jsx
// ❌ Problem: Custom keyframes interfering with Tailwind
<style>{`
    .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
`}</style>

// ✅ Solution: Remove custom CSS, use Tailwind classes only
// OR use custom CSS sparingly and avoid conflicts
```

#### **Issue 4: Loading State Interference**
```jsx
// ❌ Problem: Loading state conflicts with main animations
if (isLoading) return <LoadingSpinner />;
// Then main content has animations

// ✅ Solution: Keep loading simple, main content animation-free
if (isLoading) return <LoadingSpinner />;
// Main content: no animation classes, only transitions
```

### 📋 **Glitch-Free Implementation Checklist:**

- [ ] **No conflicting animation classes** (`animate-fade-in` + `animate-fade-in-up`)
- [ ] **No complex animation delays** (remove `style={{ animationDelay: ... }}`)
- [ ] **No custom CSS conflicts** (remove conflicting `@keyframes`)
- [ ] **Simple loading states** (only `animate-spin` for spinners)
- [ ] **Smooth transitions only** (`transition-all duration-300`)
- [ ] **Hover effects work** (`hover:scale-105`, `hover:bg-black/50`)
- [ ] **Interactive states clean** (ring effects, no glitches)
- [ ] **Backdrop blur effects** (`backdrop-blur-lg`, `backdrop-blur-sm`)

### 🎯 **Recommended Animation Approach:**

1. **Loading States**: Use `animate-spin` for spinners only
2. **Transitions**: Use `transition-all duration-300/500` for smooth effects
3. **Hover Effects**: Use `hover:scale-105`, `hover:bg-black/50` for interactions
4. **Interactive States**: Use ring effects and color changes
5. **Glass Effects**: Use `backdrop-blur-lg` and transparency
6. **Avoid**: Complex animations, delays, and custom CSS conflicts

## Implementation Checklist

When creating new pages, ensure you have:

- [ ] Dark theme with `bg-black/40` backgrounds
- [ ] Backdrop blur effects (`backdrop-blur-lg`)
- [ ] Gradient header with icon container
- [ ] Consistent spacing (`space-y-6`, `gap-6`)
- [ ] Enhanced hover animations (`transition-all duration-500`)
- [ ] Interactive hover states with ring effects
- [ ] Proper icon sizing and containers with hover effects
- [ ] Status badges with semi-transparent backgrounds
- [ ] Responsive grid layouts
- [ ] Glass-morphism effects on cards
- [ ] Consistent border styling (`border-white/10`)
- [ ] **Loading states (simple, no conflicts)**
- [ ] **Smooth transitions (no complex animations)**
- [ ] **Interactive card highlighting (ring effects)**
- [ ] **Enhanced hover effects and shadows**
- [ ] **Micro-interactions (scale, rotation)**
- [ ] **No animation conflicts or glitches**

## File Structure

```
resources/js/Pages/
├── Network/
│   └── Dashboard.jsx          # Enhanced implementation (glitch-free)
├── Project/
│   └── Index.jsx              # Reference implementation
├── Departments/
│   ├── Index.jsx              # Glitch-free implementation
│   ├── Create.jsx             # Glitch-free implementation
│   ├── Edit.jsx               # Glitch-free implementation
│   └── Show.jsx               # Glitch-free implementation
└── [Other sections]/
    └── [Page].jsx             # Apply this glitch-free style guide
```

This enhanced style guide ensures consistency across all pages while maintaining the modern, professional appearance and adding engaging interactions without animation glitches. **Always prioritize smooth transitions over complex animations to avoid conflicts.**
