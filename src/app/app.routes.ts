import { Routes } from '@angular/router';
import { TubeComponent } from './components/tube.component';
import { TubesComponent } from './components/tubes.component';

export const routes: Routes = [
    { path: '', redirectTo: '/tube', pathMatch: 'full' },
    { path: 'tube/:id', component: TubeComponent },
    { path: 'tube', component: TubesComponent },
];
