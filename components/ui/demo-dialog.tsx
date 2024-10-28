import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";

function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button">Demo</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[610px]">
        <DialogHeader>
          <DialogTitle>Demo Video</DialogTitle>
          <DialogDescription>
            Check out this video to see how BEEXPERT is used.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/93LG3ryrZWE?si=XhR5c7e5VaNOOPJo"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
        <DialogFooter>
          <Button>
            <DialogClose>Finish</DialogClose>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

DialogDemo.displayName = "DialogDemo";
export { DialogDemo };
