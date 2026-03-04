import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
    onExportCSV: () => void;
    onExportPDF: () => void;
    label?: string;
}

export function ExportButton({ onExportCSV, onExportPDF, label = "Export" }: ExportButtonProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    {label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportCSV} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
                    <FileText className="w-4 h-4 text-red-500" />
                    Export as PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
