import { Routes } from '@angular/router';

/**
 * Application routes. Ordering matters for the router: static segments
 * (e.g. `mandators/new`) must be declared before dynamic ones with the
 * same segment count (e.g. `mandators/:id`).
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'interfaces',
    loadComponent: () => import('./features/interfaces/interface-list/interface-list.component').then((m) => m.InterfaceListComponent),
  },
  {
    path: 'interfaces/new',
    loadComponent: () => import('./features/interfaces/interface-form/interface-form.component').then((m) => m.InterfaceFormComponent),
    data: { mode: 'create' },
  },
  {
    path: 'interfaces/:id/edit',
    loadComponent: () => import('./features/interfaces/interface-form/interface-form.component').then((m) => m.InterfaceFormComponent),
    data: { mode: 'edit' },
  },
  {
    path: 'interfaces/:id/mapping-template',
    loadComponent: () =>
      import('./features/interfaces/mapping-template-edit/mapping-template-edit.component').then((m) => m.MappingTemplateEditComponent),
  },
  {
    path: 'interfaces/:id/configuration-template',
    loadComponent: () =>
      import('./features/interfaces/configuration-template-edit/configuration-template-edit.component').then(
        (m) => m.ConfigurationTemplateEditComponent,
      ),
  },
  {
    path: 'interfaces/:id',
    loadComponent: () => import('./features/interfaces/interface-detail/interface-detail.component').then((m) => m.InterfaceDetailComponent),
  },
  {
    path: 'mandators',
    loadComponent: () => import('./features/mandators/mandator-list/mandator-list.component').then((m) => m.MandatorListComponent),
  },
  {
    path: 'mandators/new',
    loadComponent: () => import('./features/mandators/mandator-form/mandator-form.component').then((m) => m.MandatorFormComponent),
    data: { mode: 'create' },
  },
  {
    path: 'mandators/:id/edit',
    loadComponent: () => import('./features/mandators/mandator-form/mandator-form.component').then((m) => m.MandatorFormComponent),
    data: { mode: 'edit' },
  },
  {
    path: 'mandators/:mandatorId/companies/new',
    loadComponent: () => import('./features/companies/company-form/company-form.component').then((m) => m.CompanyFormComponent),
    data: { mode: 'create' },
  },
  {
    path: 'mandators/:id',
    loadComponent: () => import('./features/mandators/mandator-detail/mandator-detail.component').then((m) => m.MandatorDetailComponent),
  },
  {
    path: 'companies/:id/edit',
    loadComponent: () => import('./features/companies/company-form/company-form.component').then((m) => m.CompanyFormComponent),
    data: { mode: 'edit' },
  },
  {
    path: 'companies/:companyId/mappings/:mappingId',
    loadComponent: () =>
      import('./features/company-mapping/company-mapping-detail/company-mapping-detail.component').then(
        (m) => m.CompanyMappingDetailComponent,
      ),
  },
  {
    path: 'companies/:companyId/configurations/:configId',
    loadComponent: () =>
      import('./features/company-configuration/company-configuration-detail/company-configuration-detail.component').then(
        (m) => m.CompanyConfigurationDetailComponent,
      ),
  },
  {
    path: 'companies/:id',
    loadComponent: () => import('./features/companies/company-detail/company-detail.component').then((m) => m.CompanyDetailComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
