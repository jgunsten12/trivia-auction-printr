"use client"

import { useState, useEffect, useCallback } from "react"
import { Upload, Plus, Trash2, Check, Search, X, Printer, Settings, Moon, Sun, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface Attendee {
  id: number
  firstName: string
  lastName: string
  tableNumber: string
  printed: boolean
}

interface Package {
  id: number
  name: string
  printed: boolean
}

interface AppData {
  attendees: Attendee[]
  packages: Package[]
  printed: { attendeeId: number; packageIds: number[]; timestamp: string }[]
}

export default function AuctionLabelPrinter() {
  const [data, setData] = useState<AppData>({ attendees: [], packages: [], printed: [] })
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  const [selectedPackages, setSelectedPackages] = useState<number[]>([])
  const [attendeeSearch, setAttendeeSearch] = useState("")
  const [packageSearch, setPackageSearch] = useState("")
  const [showAddAttendee, setShowAddAttendee] = useState(false)
  const [showAddPackage, setShowAddPackage] = useState(false)
  const [newAttendee, setNewAttendee] = useState({ firstName: "", lastName: "", tableNumber: "" })
  const [newPackage, setNewPackage] = useState({ name: "" })
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("auctionLabelData")
    if (savedData) {
      setData(JSON.parse(savedData))
    }
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "light") {
      setIsDarkMode(false)
      document.documentElement.classList.add("light")
    }
  }, [])

  // Save data to localStorage when it changes
  const saveData = useCallback((newData: AppData) => {
    setData(newData)
    localStorage.setItem("auctionLabelData", JSON.stringify(newData))
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("light")
    localStorage.setItem("theme", isDarkMode ? "light" : "dark")
  }

  const handleFileUpload = (type: "attendees" | "packages") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const lines = content.split("\n").filter(line => line.trim())
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim())
      
      if (type === "attendees") {
        const attendees: Attendee[] = lines.slice(1).map((line, i) => {
          const values = line.split(",").map(v => v.trim())
          const row: Record<string, string> = {}
          headers.forEach((h, idx) => {
            row[h] = values[idx] || ""
          })
          return {
            id: i,
            firstName: row["first name"] || row["firstname"] || "",
            lastName: row["last name"] || row["lastname"] || "",
            tableNumber: row["table number"] || row["tablenumber"] || row["table #"] || row["table"] || "",
            printed: false
          }
        })
        saveData({ ...data, attendees })
      } else {
        const packages: Package[] = lines.slice(1).map((line, i) => {
          const values = line.split(",").map(v => v.trim())
          const row: Record<string, string> = {}
          headers.forEach((h, idx) => {
            row[h] = values[idx] || ""
          })
          return {
            id: i,
            name: row["package name"] || row["packagename"] || row["name"] || values[0] || "",
            printed: false
          }
        })
        saveData({ ...data, packages })
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const addAttendee = () => {
    if (!newAttendee.firstName && !newAttendee.lastName) return
    const newId = Math.max(...data.attendees.map(a => a.id), -1) + 1
    const attendee: Attendee = { ...newAttendee, id: newId, printed: false }
    saveData({ ...data, attendees: [...data.attendees, attendee] })
    setNewAttendee({ firstName: "", lastName: "", tableNumber: "" })
    setShowAddAttendee(false)
  }

  const addPackage = () => {
    if (!newPackage.name) return
    const newId = Math.max(...data.packages.map(p => p.id), -1) + 1
    const pkg: Package = { ...newPackage, id: newId, printed: false }
    saveData({ ...data, packages: [...data.packages, pkg] })
    setNewPackage({ name: "" })
    setShowAddPackage(false)
  }

  const deleteAttendee = (id: number) => {
    saveData({ ...data, attendees: data.attendees.filter(a => a.id !== id) })
    if (selectedAttendee?.id === id) setSelectedAttendee(null)
  }

  const deletePackage = (id: number) => {
    saveData({ ...data, packages: data.packages.filter(p => p.id !== id) })
    setSelectedPackages(selectedPackages.filter(pid => pid !== id))
  }

  const togglePackageSelection = (id: number) => {
    setSelectedPackages(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    )
  }

  const handlePrint = () => {
    if (!selectedAttendee) return

    // Open print window
    const printWindow = window.open("", "_blank", "width=300,height=200")
    if (!printWindow) return

    const selectedPkgs = data.packages.filter(p => selectedPackages.includes(p.id))

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: 2.25in 1.25in; margin: 0; }
          body {
            width: 2.25in;
            height: 1.25in;
            padding: 0.1in 0.1in 0.1in 0.15in;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 2pt 8pt; margin-bottom: 3pt; }
          .name { font-size: 12pt; font-weight: bold; }
          .table { font-size: 9pt; color: #333; }
          .divider { height: 1px; background: #ddd; margin: 4pt 0; }
          .packages { font-size: 8pt; line-height: 1.3; }
          .total { font-size: 7pt; font-weight: 600; color: #666; margin-top: 4pt; text-transform: uppercase; letter-spacing: 0.05em; }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="name">${selectedAttendee.firstName} ${selectedAttendee.lastName}</span>
          <span class="table">Table ${selectedAttendee.tableNumber}</span>
        </div>
        ${selectedPkgs.length > 0 ? `
          <div class="divider"></div>
          <div class="packages">${selectedPkgs.map(p => p.name).join(", ")}</div>
          <div class="total">${selectedPkgs.length} item${selectedPkgs.length > 1 ? "s" : ""} won</div>
        ` : ""}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()

    // Mark as printed
    const updatedAttendees = data.attendees.map(a => 
      a.id === selectedAttendee.id ? { ...a, printed: true } : a
    )
    const updatedPackages = data.packages.map(p => 
      selectedPackages.includes(p.id) ? { ...p, printed: true } : p
    )
    saveData({
      ...data,
      attendees: updatedAttendees,
      packages: updatedPackages,
      printed: [...data.printed, { attendeeId: selectedAttendee.id, packageIds: selectedPackages, timestamp: new Date().toISOString() }]
    })
    setSelectedAttendee(null)
    setSelectedPackages([])
  }

  const resetPrintStatus = (type: "attendee" | "package", id: number) => {
    if (type === "attendee") {
      saveData({
        ...data,
        attendees: data.attendees.map(a => a.id === id ? { ...a, printed: false } : a)
      })
    } else {
      saveData({
        ...data,
        packages: data.packages.map(p => p.id === id ? { ...p, printed: false } : p)
      })
    }
  }

  const clearAll = (type: "attendees" | "packages" | "all") => {
    if (type === "attendees") {
      saveData({ ...data, attendees: [] })
      setSelectedAttendee(null)
    } else if (type === "packages") {
      saveData({ ...data, packages: [] })
      setSelectedPackages([])
    } else {
      saveData({ attendees: [], packages: [], printed: [] })
      setSelectedAttendee(null)
      setSelectedPackages([])
    }
  }

  const filteredAttendees = data.attendees.filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
    a.tableNumber.includes(attendeeSearch)
  )

  const filteredPackages = data.packages.filter(p => 
    p.name.toLowerCase().includes(packageSearch.toLowerCase())
  )

  const selectedPackageNames = data.packages.filter(p => selectedPackages.includes(p.id))

  return (
    <div className={cn("min-h-screen bg-background text-foreground transition-colors", !isDarkMode && "light")}>
      <div className="container mx-auto max-w-7xl p-4 md:p-8">
        {/* Header */}
        <header className="mb-8 border-b border-border pb-4 text-center relative">
          <div className="absolute right-0 top-0 flex gap-2">
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">{isDarkMode ? "Dark" : "Light"}</span>
            </Button>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Clear Attendees</h4>
                    <p className="text-sm text-muted-foreground mb-2">Remove all attendees from the list.</p>
                    <Button variant="destructive" onClick={() => clearAll("attendees")}>Clear Attendees</Button>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Clear Packages</h4>
                    <p className="text-sm text-muted-foreground mb-2">Remove all packages from the list.</p>
                    <Button variant="destructive" onClick={() => clearAll("packages")}>Clear Packages</Button>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Clear All Data</h4>
                    <p className="text-sm text-muted-foreground mb-2">Remove all data including print history.</p>
                    <Button variant="destructive" onClick={() => clearAll("all")}>Clear All Data</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Auction <span className="text-primary">Label</span> Printer
          </h1>
          <p className="text-muted-foreground">Manage attendees and print auction labels</p>
        </header>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_380px]">
          {/* Attendees Panel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-normal">Attendees</CardTitle>
              <div className="flex gap-2">
                <label>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload("attendees")} />
                  <Button variant="secondary" size="sm" asChild>
                    <span><Upload className="h-4 w-4 mr-1" /> Import</span>
                  </Button>
                </label>
                <Button variant="secondary" size="sm" onClick={() => setShowAddAttendee(!showAddAttendee)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddAttendee && (
                <div className="mb-4 p-4 rounded-lg bg-muted">
                  <div className="grid gap-2 mb-2">
                    <Input 
                      placeholder="First Name" 
                      value={newAttendee.firstName} 
                      onChange={e => setNewAttendee({ ...newAttendee, firstName: e.target.value })}
                    />
                    <Input 
                      placeholder="Last Name" 
                      value={newAttendee.lastName} 
                      onChange={e => setNewAttendee({ ...newAttendee, lastName: e.target.value })}
                    />
                    <Input 
                      placeholder="Table #" 
                      value={newAttendee.tableNumber} 
                      onChange={e => setNewAttendee({ ...newAttendee, tableNumber: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addAttendee}>Add</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddAttendee(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search attendees..." 
                  className="pl-9 pr-8"
                  value={attendeeSearch}
                  onChange={e => setAttendeeSearch(e.target.value)}
                />
                {attendeeSearch && (
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded" onClick={() => setAttendeeSearch("")}>
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredAttendees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {data.attendees.length === 0 ? "Import a CSV or add attendees manually" : "No attendees found"}
                  </div>
                ) : (
                  filteredAttendees.map(attendee => (
                    <div 
                      key={attendee.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2",
                        attendee.printed ? "opacity-50 bg-muted" : "bg-muted/50 hover:bg-muted",
                        selectedAttendee?.id === attendee.id ? "border-primary bg-primary/10" : "border-transparent"
                      )}
                      onClick={() => setSelectedAttendee(attendee)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                        selectedAttendee?.id === attendee.id ? "bg-primary border-primary" : "border-border"
                      )}>
                        {selectedAttendee?.id === attendee.id && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-medium truncate", attendee.printed && "line-through text-muted-foreground")}>
                          {attendee.firstName} {attendee.lastName}
                        </div>
                        <div className={cn("text-sm text-muted-foreground", attendee.printed && "line-through")}>
                          Table {attendee.tableNumber}
                        </div>
                      </div>
                      {attendee.printed && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500 text-green-950 font-semibold uppercase">
                          Printed
                        </span>
                      )}
                      <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        {attendee.printed && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); resetPrintStatus("attendee", attendee.id) }}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteAttendee(attendee.id) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Packages Panel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-normal">Packages</CardTitle>
              <div className="flex gap-2">
                <label>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload("packages")} />
                  <Button variant="secondary" size="sm" asChild>
                    <span><Upload className="h-4 w-4 mr-1" /> Import</span>
                  </Button>
                </label>
                <Button variant="secondary" size="sm" onClick={() => setShowAddPackage(!showAddPackage)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddPackage && (
                <div className="mb-4 p-4 rounded-lg bg-muted">
                  <Input 
                    placeholder="Package Name" 
                    className="mb-2"
                    value={newPackage.name} 
                    onChange={e => setNewPackage({ name: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addPackage}>Add</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddPackage(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search packages..." 
                  className="pl-9 pr-8"
                  value={packageSearch}
                  onChange={e => setPackageSearch(e.target.value)}
                />
                {packageSearch && (
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded" onClick={() => setPackageSearch("")}>
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredPackages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {data.packages.length === 0 ? "Import a CSV or add packages manually" : "No packages found"}
                  </div>
                ) : (
                  filteredPackages.map(pkg => (
                    <div 
                      key={pkg.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2",
                        pkg.printed ? "opacity-50 bg-muted" : "bg-muted/50 hover:bg-muted",
                        selectedPackages.includes(pkg.id) ? "border-primary bg-primary/10" : "border-transparent"
                      )}
                      onClick={() => togglePackageSelection(pkg.id)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                        selectedPackages.includes(pkg.id) ? "bg-primary border-primary" : "border-border"
                      )}>
                        {selectedPackages.includes(pkg.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("font-medium truncate", pkg.printed && "line-through text-muted-foreground")}>
                          {pkg.name}
                        </div>
                      </div>
                      {pkg.printed && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500 text-green-950 font-semibold uppercase">
                          Printed
                        </span>
                      )}
                      <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                        {pkg.printed && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); resetPrintStatus("package", pkg.id) }}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deletePackage(pkg.id) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Print Panel */}
          <Card className="lg:sticky lg:top-8">
            <CardHeader>
              <CardTitle className="text-xl font-normal">Print Label</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Selected Attendee</div>
                  <div className={cn("text-foreground", !selectedAttendee && "text-muted-foreground italic")}>
                    {selectedAttendee 
                      ? `${selectedAttendee.firstName} ${selectedAttendee.lastName} - Table ${selectedAttendee.tableNumber}`
                      : "No attendee selected"}
                  </div>
                  
                  {selectedPackageNames.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Selected Packages</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedPackageNames.map(pkg => (
                          <span key={pkg.id} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground font-medium">
                            {pkg.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Label Preview */}
                {selectedAttendee && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Preview</div>
                    <div className="bg-white rounded p-3 text-black" style={{ aspectRatio: "2.25/1.25" }}>
                      <div className="flex flex-wrap justify-between items-baseline gap-1 mb-1">
                        <span className="text-sm font-semibold">
                          {selectedAttendee.firstName} {selectedAttendee.lastName}
                        </span>
                        <span className="text-xs text-gray-600">Table {selectedAttendee.tableNumber}</span>
                      </div>
                      {selectedPackageNames.length > 0 && (
                        <>
                          <div className="h-px bg-gray-300 my-1.5" />
                          <div className="text-[10px] leading-tight">
                            {selectedPackageNames.map(p => p.name).join(", ")}
                          </div>
                          <div className="text-[8px] font-semibold text-gray-500 mt-1 uppercase tracking-wide">
                            {selectedPackageNames.length} item{selectedPackageNames.length > 1 ? "s" : ""} won
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg" 
                  disabled={!selectedAttendee}
                  onClick={handlePrint}
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Label
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
