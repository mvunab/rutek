import type { CreateTenantInput } from '../../services/superAdmin.service';
import { generatePassword } from './tenantUtils';

export type TenantModalState = {
  open: boolean;
  editing: unknown | null;
  form: CreateTenantInput;
  showAdminSection: boolean;
  generatedPassword: string;
};

export type TenantModalAction =
  | { type: 'open_create' }
  | { type: 'open_edit'; tenant: unknown; form: CreateTenantInput }
  | { type: 'close' }
  | { type: 'set_form'; form: CreateTenantInput }
  | { type: 'toggle_admin_section' }
  | { type: 'regenerate_password'; password: string };

const initialModalState: TenantModalState = {
  open: false,
  editing: null,
  form: { name: '', rut: '', plan: 'starter' },
  showAdminSection: true,
  generatedPassword: '',
};

export function tenantModalReducer(state: TenantModalState, action: TenantModalAction): TenantModalState {
  switch (action.type) {
    case 'open_create': {
      const pass = generatePassword();
      return {
        open: true,
        editing: null,
        form: { name: '', rut: '', plan: 'starter', adminPassword: pass },
        showAdminSection: true,
        generatedPassword: pass,
      };
    }
    case 'open_edit':
      return {
        open: true,
        editing: action.tenant,
        form: action.form,
        showAdminSection: false,
        generatedPassword: '',
      };
    case 'close':
      return initialModalState;
    case 'set_form':
      return { ...state, form: action.form };
    case 'toggle_admin_section':
      return { ...state, showAdminSection: !state.showAdminSection };
    case 'regenerate_password':
      return {
        ...state,
        generatedPassword: action.password,
        form: { ...state.form, adminPassword: action.password },
      };
    default:
      return state;
  }
}

export { initialModalState };
