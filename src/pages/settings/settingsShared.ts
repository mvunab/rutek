import type { Tenant } from '../../types';

export type CompanyForm = {
  name: string;
  legalName: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  plan: Tenant['plan'];
};

export const emptyForm: CompanyForm = {
  name: '',
  legalName: '',
  rut: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  region: '',
  plan: 'starter',
};

export function tenantToForm(tenant: Tenant): CompanyForm {
  return {
    name: tenant.name,
    legalName: tenant.legalName ?? '',
    rut: tenant.rut,
    email: tenant.email ?? '',
    phone: tenant.phone ?? '',
    address: tenant.address ?? '',
    city: tenant.city ?? '',
    region: tenant.region ?? '',
    plan: tenant.plan,
  };
}

export function isTenantAdmin(role: string | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}
