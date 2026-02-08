import { Toaster } from "@/components/ui/sonner";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "../app/layout";
import { FileXIcon } from "@phosphor-icons/react";
import FileBrowser from "./home";

function NotFound() {
  return (
    <div className="flex items-center justify-center mt-[20%] px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <FileXIcon className="w-16 h-16 text-muted-foreground mb-6" />
        <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page{" "}
          <span className="inline-block bg-muted-foreground/10 px-2 py-0.5 rounded-sm text-sm">
            {window.location.pathname}
          </span>{" "}
          does not exist.
        </p>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();

  return (
    <>
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<FileBrowser />} />
          <Route path="/home" element={<FileBrowser />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
