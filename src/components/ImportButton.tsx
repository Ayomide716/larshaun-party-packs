import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { parseCSV } from "@/lib/importUtils";

interface ImportButtonProps<T> {
    onImport: (data: T[]) => void;
    expectedHeaders?: string[];
    label?: string;
}

export function ImportButton<T>({ onImport, expectedHeaders, label = "Import CSV" }: ImportButtonProps<T>) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        parseCSV<T>(file, onImport, expectedHeaders);

        // Reset the input so the same file can be uploaded again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="w-4 h-4" />
                {label}
            </Button>
        </>
    );
}
