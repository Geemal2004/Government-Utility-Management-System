'use client';

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { CreateEmployeeFormData } from '@/lib/validations/employee';
import { FormInput, FormSelect, FormCheckbox, FormSection } from './FormInputs';

interface RoleSpecificFieldsProps {
    register: UseFormRegister<CreateEmployeeFormData>;
    errors: FieldErrors<CreateEmployeeFormData>;
    watch: UseFormWatch<CreateEmployeeFormData>;
}

export function RoleSpecificFields({ register, errors, watch }: RoleSpecificFieldsProps) {
    const role = watch('role');

    if (!role) return null;

    return (
        <div className="animate-fadeIn">
            {role === 'MANAGER' && (
                <ManagerFields register={register} errors={errors} />
            )}
            {role === 'FIELD_OFFICER' && (
                <FieldOfficerFields register={register} errors={errors} />
            )}
            {role === 'METER_READER' && (
                <MeterReaderFields register={register} errors={errors} />
            )}
            {role === 'CASHIER' && (
                <CashierFields register={register} errors={errors} />
            )}
            {role === 'ADMINISTRATIVE_STAFF' && (
                <AdminStaffFields register={register} errors={errors} />
            )}
        </div>
    );
}

// Manager-specific fields
function ManagerFields({
    register,
    errors,
}: {
    register: UseFormRegister<CreateEmployeeFormData>;
    errors: FieldErrors<CreateEmployeeFormData>;
}) {
    return (
        <FormSection
            title="Manager Details"
            description="Configure management level and access permissions"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelect
                    label="Management Level"
                    required
                    {...register('managementLevel')}
                    error={errors.managementLevel?.message}
                    placeholder="Select level"
                    options={[
                        { value: 'SENIOR', label: 'Senior' },
                        { value: 'MIDDLE', label: 'Middle' },
                        { value: 'JUNIOR', label: 'Junior' },
                    ]}
                />
                <FormSelect
                    label="Report Access Level"
                    required
                    {...register('reportAccessLevel')}
                    error={errors.reportAccessLevel?.message}
                    placeholder="Select access level"
                    options={[
                        { value: 'ALL', label: 'All Reports' },
                        { value: 'DEPARTMENT', label: 'Department Only' },
                        { value: 'TEAM', label: 'Team Only' },
                    ]}
                />
            </div>
        </FormSection>
    );
}

// Field Officer-specific fields
function FieldOfficerFields({
    register,
    errors,
}: {
    register: UseFormRegister<CreateEmployeeFormData>;
    errors: FieldErrors<CreateEmployeeFormData>;
}) {
    return (
        <FormSection
            title="Field Officer Details"
            description="Configure field work parameters"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Service Area Type"
                    required
                    {...register('serviceAreaType')}
                    error={errors.serviceAreaType?.message}
                    placeholder="e.g., Urban, Rural, Industrial"
                />
                <FormSelect
                    label="Shift Type"
                    required
                    {...register('shiftType')}
                    error={errors.shiftType?.message}
                    placeholder="Select shift"
                    options={[
                        { value: 'MORNING', label: 'Morning (6AM - 2PM)' },
                        { value: 'AFTERNOON', label: 'Afternoon (2PM - 10PM)' },
                        { value: 'NIGHT', label: 'Night (10PM - 6AM)' },
                        { value: 'ROTATING', label: 'Rotating' },
                    ]}
                />
                <FormInput
                    label="Certification Level"
                    {...register('certificationLevel')}
                    error={errors.certificationLevel?.message}
                    placeholder="e.g., Level 1, Level 2"
                />
                <FormInput
                    label="Geographic Area"
                    required
                    {...register('geographicArea')}
                    error={errors.geographicArea?.message}
                    placeholder="Enter assigned area"
                />
            </div>
        </FormSection>
    );
}

// Meter Reader-specific fields
function MeterReaderFields({
    register,
    errors,
}: {
    register: UseFormRegister<CreateEmployeeFormData>;
    errors: FieldErrors<CreateEmployeeFormData>;
}) {
    return (
        <FormSection
            title="Meter Reader Details"
            description="Configure meter reading equipment and routes"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Device ID"
                    {...register('deviceId')}
                    error={errors.deviceId?.message}
                    placeholder="Enter assigned device ID"
                />
                <FormInput
                    label="Assigned Route Code"
                    {...register('assignedRouteCode')}
                    error={errors.assignedRouteCode?.message}
                    placeholder="e.g., ROUTE-001"
                />
            </div>
        </FormSection>
    );
}

// Cashier-specific fields
function CashierFields({
    register,
    errors,
}: {
    register: UseFormRegister<CreateEmployeeFormData>;
    errors: FieldErrors<CreateEmployeeFormData>;
}) {
    return (
        <FormSection
            title="Cashier Permissions"
            description="Configure payment handling permissions"
        >
            <div className="space-y-4">
                <FormCheckbox
                    label="Can Override Charges"
                    description="Allow overriding calculated charges during payment"
                    {...register('canOverrideCharges')}
                />
                <FormCheckbox
                    label="Can Approve Refunds"
                    description="Allow processing and approving customer refunds"
                    {...register('canApproveRefunds')}
                />
            </div>
        </FormSection>
    );
}

// Administrative Staff-specific fields
function AdminStaffFields({
    register,
    errors,
}: {
    register: UseFormRegister<CreateEmployeeFormData>;
    errors: FieldErrors<CreateEmployeeFormData>;
}) {
    return (
        <FormSection
            title="Administrative Permissions"
            description="Configure administrative access levels"
        >
            <div className="space-y-4">
                <FormCheckbox
                    label="Can Register Connections"
                    description="Allow registering new service connections"
                    {...register('canRegisterConnections')}
                />
                <FormCheckbox
                    label="Can Manage Tariffs"
                    description="Allow creating and modifying utility tariffs"
                    {...register('canManageTariffs')}
                />
            </div>
        </FormSection>
    );
}
