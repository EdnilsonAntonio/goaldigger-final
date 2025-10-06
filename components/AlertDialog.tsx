import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface AlertDialogDemoProps {
    contentClassName: string;
    trigger: React.ReactNode
    title: string
    description: string
    cancel: string;
    proceed: string;
    onProceed: () => void;
}

export function AlertDialogDemo({
    trigger,
    title,
    description,
    cancel,
    proceed,
    contentClassName,
    onProceed
}: AlertDialogDemoProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-md border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700">
                    {trigger}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className={`bg-neutral-800 text-white border border-neutral-700 ${contentClassName || ""}`}>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-neutral-800 text-white border-neutral-600 hover:bg-neutral-700">{cancel}</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white border border-red-700" onClick={() => onProceed()}>{proceed}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
