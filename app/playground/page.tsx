import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/ui/header";
import Playground from "@/components/ui/playground";

export default function Main() {
  return (
    <div className="h-full flex flex-col md:flex">
      <Header
        isFixed={false}
      />
      <Separator />
      <div className="h-full py-6 px-4">
        <div className="flex h-full flex-col">
          <Playground />
        </div>
      </div>
    </div>
  );
}
