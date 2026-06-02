"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Link as LinkIcon, Upload } from "lucide-react";
import { ImportFilePanel } from "./ImportFilePanel";
import { ImportTextPanel } from "./ImportTextPanel";
import { ImportUrlPanel } from "./ImportUrlPanel";

export function ImportModeTabs() {
  return (
    <Tabs defaultValue="text">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="text" data-testid="tab-text">
          <FileText className="h-4 w-4" />
          Texto
        </TabsTrigger>
        <TabsTrigger value="file" data-testid="tab-file">
          <Upload className="h-4 w-4" />
          Arquivo
        </TabsTrigger>
        <TabsTrigger value="url" data-testid="tab-url">
          <LinkIcon className="h-4 w-4" />
          Link
        </TabsTrigger>
      </TabsList>

      <TabsContent value="text" className="mt-4">
        <ImportTextPanel />
      </TabsContent>
      <TabsContent value="file" className="mt-4">
        <ImportFilePanel />
      </TabsContent>
      <TabsContent value="url" className="mt-4">
        <ImportUrlPanel />
      </TabsContent>
    </Tabs>
  );
}
