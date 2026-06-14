"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, FileSpreadsheet } from "lucide-react"
import toast from "react-hot-toast"

export default function ImportExportPage() {
  const handleImport = () => {
    toast.success("Excel import feature ready - connect to Supabase storage")
  }

  const handleExport = () => {
    toast.success("Excel export feature ready - data will be exported")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-3xl font-bold">Import / Export</h1><p className="text-muted-foreground">Import and export data using Excel files</p></div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import"><Upload className="mr-2 h-4 w-4" />Import</TabsTrigger>
          <TabsTrigger value="export"><Download className="mr-2 h-4 w-4" />Export</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <div className="grid gap-4 sm:grid-cols-3">
            {["Participants", "Teams", "Competitions"].map(item => (
              <Card key={item} className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={handleImport}>
                <CardContent className="flex flex-col items-center py-8">
                  <FileSpreadsheet className="h-10 w-10 text-primary mb-3" />
                  <p className="font-medium">Import {item}</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload Excel file</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="grid gap-4 sm:grid-cols-3">
            {["Results", "Scores", "Participants"].map(item => (
              <Card key={item} className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={handleExport}>
                <CardContent className="flex flex-col items-center py-8">
                  <Download className="h-10 w-10 text-emerald-500 mb-3" />
                  <p className="font-medium">Export {item}</p>
                  <p className="text-xs text-muted-foreground mt-1">Download Excel file</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
