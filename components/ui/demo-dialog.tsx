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
          <DialogTitle>Demonstration</DialogTitle>
          <DialogDescription>
            Check out this video to see how BEEXPERT is used. This demonstration
            will guide you through the main features and functionalities of our
            platform. If you have further questions, do not hesitate to ask our
            team. 😊👍
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/93LG3ryrZWE?si=XhR5c7e5VaNOOPJo?autoplay=1"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
        <DialogFooter>
          <Button>
            <DialogClose>Okay, I got it!</DialogClose>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

DialogDemo.displayName = "DialogDemo";
export { DialogDemo };
