import Papa from 'papaparse';
import { toast } from 'sonner';

export const parseCSV = <T>(
    file: File,
    onComplete: (data: T[]) => void,
    expectedHeaders?: string[]
) => {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            // Basic validation if expectedHeaders are provided
            if (expectedHeaders && results.meta.fields) {
                const missingHeaders = expectedHeaders.filter(
                    (h) => !results.meta.fields?.includes(h)
                );

                if (missingHeaders.length > 0) {
                    toast.error(`Invalid CSV structure. Missing columns: ${missingHeaders.join(', ')}`);
                    return;
                }
            }

            onComplete(results.data as T[]);
            toast.success(`Successfully imported ${results.data.length} records`);
        },
        error: (error) => {
            toast.error(`Error parsing CSV: ${error.message}`);
        }
    });
};
