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
        transformHeader: (header) => header.trim(),
        complete: (results) => {
            // Basic validation if expectedHeaders are provided
            if (expectedHeaders && results.meta.fields) {
                const resultsHeaders = results.meta.fields.map(h => h.trim().toLowerCase().replace(/_\d+$/, ''));
                const missingHeaders = expectedHeaders.filter(
                    (h) => !resultsHeaders.includes(h.trim().toLowerCase())
                );

                if (missingHeaders.length > 0) {
                    toast.error(`Invalid CSV structure. Missing columns: ${missingHeaders.join(', ')}`);
                    return;
                }
            }

            onComplete(results.data as T[]);
        },
        error: (error) => {
            toast.error(`Error parsing CSV: ${error.message}`);
        }
    });
};
