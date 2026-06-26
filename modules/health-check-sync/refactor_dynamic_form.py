import os

file_path = 'd:/AI/vClinic/modules/health-check-sync/forms/DynamicForm.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = 0
for i, line in enumerate(lines):
    if 'const DynamicForm: React.FC<DynamicFormProps> = ({' in line:
        start_idx = i + 1
        break

end_idx = 0
for i, line in enumerate(lines):
    if 'return (' in line and i > start_idx:
        end_idx = i
        break

hook_body = lines[start_idx:end_idx]

# To get all returned state variables, we look at the lines between 'return (' and '}}>'
# Wait, let's just parse the provider value block
provider_start = 0
provider_end = 0
for i, line in enumerate(lines):
    if '<DynamicFormContext.Provider value={{' in line:
        provider_start = i + 1
    if '}}>' in line and provider_start > 0:
        provider_end = i
        break

provider_vars = lines[provider_start:provider_end]
# Add handleSubmit
provider_vars.append('            handleSubmit,\n')

hook_imports = '''import { useState, useEffect } from 'react';
import { healthCheckService } from '../../../services/healthCheckService';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { useCatalogs } from '../hooks/useCatalogs';

export const useDynamicFormState = (formType: string, initialData: any, onSave: (data: any) => void) => {
'''

with open('d:/AI/vClinic/modules/health-check-sync/hooks/useDynamicFormState.ts', 'w', encoding='utf-8') as f:
    f.write(hook_imports)
    f.writelines(hook_body)
    f.write('    return {\n')
    f.writelines(provider_vars)
    f.write('    };\n};\n')

# Now rewrite DynamicForm.tsx
# Replace everything from start_idx to provider_end + 1 (the }}) with a call to the hook
new_dynamic_form = lines[:start_idx]
new_dynamic_form.append('    const formState = useDynamicFormState(formType, initialData, onSave);\n')
new_dynamic_form.append('    const { activeTab, setActiveTab, handleSubmit, isChild, isStudent } = formState;\n')
new_dynamic_form.append('\n')
new_dynamic_form.append('    return (\n')
new_dynamic_form.append('        <DynamicFormContext.Provider value={formState}>\n')

# Append the rest from provider_end + 1
new_dynamic_form.extend(lines[provider_end + 1:])

# Don't forget to add the import to DynamicForm.tsx
import_line = "import { useDynamicFormState } from '../hooks/useDynamicFormState';\n"
new_dynamic_form.insert(2, import_line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_dynamic_form)

print("Done refactoring DynamicForm.tsx")
