"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, X, Printer, Settings, Moon, Sun, Plus, Upload, Search, RotateCcw, Trash2 } from "lucide-react"

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
}

export default function AuctionLabelPrinter() {
  const [data, setData] = useState<AppData>({ attendees: [], packages: [] })
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  const [selectedPackages, setSelectedPackages] = useState<Package[]>([])
  const [attendeeSearch, setAttendeeSearch] = useState("")
  const [packageSearch, setPackageSearch] = useState("")
  const [showAddAttendee, setShowAddAttendee] = useState(false)
  const [showAddPackage, setShowAddPackage] = useState(false)
  const [newAttendee, setNewAttendee] = useState({ firstName: "", lastName: "", tableNumber: "" })
  const [newPackageName, setNewPackageName] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const savedData = localStorage.getItem("auctionLabelData")
    if (savedData) {
      setData(JSON.parse(savedData))
    }
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "light") {
      document.documentElement.classList.add("light")
    }
  }, [])

  const saveData = useCallback((newData: AppData) => {
    setData(newData)
    localStorage.setItem("auctionLabelData", JSON.stringify(newData))
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle("light")
    const isLight = document.documentElement.classList.contains("light")
    localStorage.setItem("theme", isLight ? "light" : "dark")
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
        const maxId = data.attendees.length > 0 ? Math.max(...data.attendees.map(a => a.id)) : 0
        const attendees: Attendee[] = lines.slice(1).map((line, i) => {
          const values = line.split(",").map(v => v.trim())
          const row: Record<string, string> = {}
          headers.forEach((h, idx) => {
            row[h] = values[idx] || ""
          })
          return {
            id: maxId + i + 1,
            firstName: row["first name"] || row["firstname"] || row["first"] || "",
            lastName: row["last name"] || row["lastname"] || row["last"] || "",
            tableNumber: row["table number"] || row["tablenumber"] || row["table #"] || row["table"] || "",
            printed: false
          }
        })
        saveData({ ...data, attendees })
        setSelectedAttendee(null)
      } else {
        const maxId = data.packages.length > 0 ? Math.max(...data.packages.map(p => p.id)) : 0
        const packages: Package[] = lines.slice(1).map((line, i) => {
          const values = line.split(",").map(v => v.trim())
          const row: Record<string, string> = {}
          headers.forEach((h, idx) => {
            row[h] = values[idx] || ""
          })
          return {
            id: maxId + i + 1,
            name: row["package name"] || row["packagename"] || row["name"] || row["item"] || values[0] || "",
            printed: false
          }
        })
        saveData({ ...data, packages })
        setSelectedPackages([])
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const addAttendee = () => {
    if (!newAttendee.firstName || !newAttendee.lastName) return
    const newId = data.attendees.length > 0 ? Math.max(...data.attendees.map(a => a.id)) + 1 : 1
    const attendee: Attendee = { ...newAttendee, id: newId, printed: false }
    saveData({ ...data, attendees: [...data.attendees, attendee] })
    setNewAttendee({ firstName: "", lastName: "", tableNumber: "" })
    setShowAddAttendee(false)
    setAttendeeSearch("")
  }

  const addPackage = () => {
    if (!newPackageName) return
    const newId = data.packages.length > 0 ? Math.max(...data.packages.map(p => p.id)) + 1 : 1
    const pkg: Package = { name: newPackageName, id: newId, printed: false }
    saveData({ ...data, packages: [...data.packages, pkg] })
    setNewPackageName("")
    setShowAddPackage(false)
    setPackageSearch("")
  }

  const deleteAttendee = (id: number) => {
    if (!confirm("Delete this attendee?")) return
    saveData({ ...data, attendees: data.attendees.filter(a => a.id !== id) })
    if (selectedAttendee?.id === id) setSelectedAttendee(null)
  }

  const deletePackage = (id: number) => {
    if (!confirm("Delete this package?")) return
    saveData({ ...data, packages: data.packages.filter(p => p.id !== id) })
    setSelectedPackages(selectedPackages.filter(p => p.id !== id))
  }

  const selectAttendee = (attendee: Attendee) => {
    if (selectedAttendee?.id === attendee.id) {
      setSelectedAttendee(null)
    } else {
      setSelectedAttendee(attendee)
    }
  }

  const togglePackage = (pkg: Package) => {
    const idx = selectedPackages.findIndex(p => p.id === pkg.id)
    if (idx >= 0) {
      setSelectedPackages(selectedPackages.filter(p => p.id !== pkg.id))
    } else {
      setSelectedPackages([...selectedPackages, pkg])
    }
  }

  const resetStatus = (type: "attendee" | "package", id: number) => {
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

  const clearAllAttendees = () => {
    if (!confirm("Are you sure you want to delete ALL attendees? This cannot be undone.")) return
    saveData({ ...data, attendees: [] })
    setSelectedAttendee(null)
    setAttendeeSearch("")
    setSettingsOpen(false)
  }

  const clearAllPackages = () => {
    if (!confirm("Are you sure you want to delete ALL auction items? This cannot be undone.")) return
    saveData({ ...data, packages: [] })
    setSelectedPackages([])
    setPackageSearch("")
    setSettingsOpen(false)
  }

  const clearSelection = () => {
    setSelectedAttendee(null)
    setSelectedPackages([])
  }

  const splitPackagesForLabels = (packages: Package[], maxChars = 80) => {
    const groups: Package[][] = []
    let currentGroup: Package[] = []
    let currentLength = 0
    
    for (const pkg of packages) {
      const pkgLength = pkg.name.length + 3
      
      if (currentLength + pkgLength > maxChars && currentGroup.length > 0) {
        groups.push(currentGroup)
        currentGroup = [pkg]
        currentLength = pkg.name.length
      } else {
        currentGroup.push(pkg)
        currentLength += pkgLength
      }
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }
    
    return groups
  }

  const printLabel = async () => {
    if (!selectedAttendee || selectedPackages.length === 0) return

    const packageGroups = splitPackagesForLabels(selectedPackages)
    const totalLabels = packageGroups.length
    const totalItems = selectedPackages.length

    for (let i = 0; i < packageGroups.length; i++) {
      const group = packageGroups[i]
      const packageText = group.map(p => p.name).join(" | ")
      const labelNumber = totalLabels > 1 ? ` (${i + 1}/${totalLabels})` : ""
      const isLastLabel = i === packageGroups.length - 1

      const printWindow = window.open("", "_blank", "width=400,height=300")
      if (!printWindow) return

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
            @page { size: 2.25in 1.25in; margin: 0; }
            html, body {
              width: 2.25in !important;
              height: 1.25in !important;
              background: white !important;
            }
            body {
              padding: 0.1in 0.1in 0.1in 0.15in !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            }
            .header { display: flex !important; flex-wrap: wrap !important; justify-content: space-between !important; align-items: baseline !important; gap: 2pt 8pt !important; margin-bottom: 3pt !important; }
            .name { font-size: 12pt !important; font-weight: bold !important; }
            .table { font-size: 9pt !important; color: #333 !important; white-space: nowrap !important; }
            .divider { border-top: 0.5pt solid #ccc !important; margin: 4pt 0 !important; }
            .packages { font-size: 8pt !important; line-height: 1.3 !important; }
            .total { font-size: 7pt !important; font-weight: 600 !important; color: #333 !important; margin-top: 4pt !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${selectedAttendee.firstName} ${selectedAttendee.lastName}${labelNumber}</div>
            <div class="table">Table ${selectedAttendee.tableNumber || "N/A"}</div>
          </div>
          <div class="divider"></div>
          <div class="packages">${packageText}</div>
          ${isLastLabel ? `<div class="total">TOTAL ITEMS: ${totalItems}</div>` : ""}
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()

      if (i < packageGroups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    // Mark as printed
    const updatedAttendees = data.attendees.map(a => 
      a.id === selectedAttendee.id ? { ...a, printed: true } : a
    )
    const updatedPackages = data.packages.map(p => 
      selectedPackages.some(sp => sp.id === p.id) ? { ...p, printed: true } : p
    )
    saveData({ attendees: updatedAttendees, packages: updatedPackages })
    clearSelection()
  }

  // Filter and sort attendees
  const filteredAttendees = data.attendees
    .filter(a => {
      if (!attendeeSearch) return true
      const query = attendeeSearch.toLowerCase()
      const fullName = `${a.firstName} ${a.lastName}`.toLowerCase()
      const reverseName = `${a.lastName} ${a.firstName}`.toLowerCase()
      const table = (a.tableNumber || "").toLowerCase()
      return fullName.includes(query) || reverseName.includes(query) || table.includes(query)
    })
    .sort((a, b) => {
      if (a.printed !== b.printed) return a.printed ? 1 : -1
      const lastNameCompare = (a.lastName || "").localeCompare(b.lastName || "")
      if (lastNameCompare !== 0) return lastNameCompare
      return (a.firstName || "").localeCompare(b.firstName || "")
    })

  // Filter and sort packages
  const filteredPackages = data.packages
    .filter(p => {
      if (!packageSearch) return true
      return (p.name || "").toLowerCase().includes(packageSearch.toLowerCase())
    })
    .sort((a, b) => {
      if (a.printed !== b.printed) return a.printed ? 1 : -1
      return (a.name || "").localeCompare(b.name || "")
    })

  const packageGroups = selectedAttendee && selectedPackages.length > 0 
    ? splitPackagesForLabels(selectedPackages) 
    : []
  const totalLabels = packageGroups.length
  const canPrint = selectedAttendee && selectedPackages.length > 0

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>
      <div className="max-w-[1400px] mx-auto p-8">
        {/* Header */}
        <header className="text-center mb-8 pb-4 relative" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="absolute right-0 top-0 flex gap-2">
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
              style={{ 
                background: "var(--bg-elevated)", 
                border: "1px solid var(--border)",
                color: "var(--text-secondary)"
              }}
            >
              <Moon className="w-4 h-4 dark-icon" />
              <Sun className="w-4 h-4 light-icon hidden" />
              <span className="hidden sm:inline">Dark</span>
            </button>
            <button 
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg transition-all"
              style={{ 
                background: "var(--bg-elevated)", 
                border: "1px solid var(--border)",
                color: "var(--text-secondary)"
              }}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-2">
            <span className="mr-2">🖨️</span>
            Auction <span style={{ color: "var(--accent)" }}>Label</span> Printer
          </h1>
        </header>

        {/* Settings Modal */}
        {settingsOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0, 0, 0, 0.6)" }}
            onClick={(e) => e.target === e.currentTarget && setSettingsOpen(false)}
          >
            <div 
              className="w-full max-w-md rounded-xl overflow-hidden"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex justify-between items-center p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-lg font-semibold">Settings</h3>
                <button 
                  onClick={() => setSettingsOpen(false)}
                  className="p-1 rounded hover:bg-[var(--bg-elevated)] transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <h4 className="font-semibold mb-1">Data Management</h4>
                  <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                    Clear all data from the system. This action cannot be undone.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={clearAllAttendees}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all"
                      style={{ 
                        background: "transparent", 
                        border: "1px solid var(--danger)",
                        color: "var(--danger)"
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Attendees
                    </button>
                    <button 
                      onClick={clearAllPackages}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all"
                      style={{ 
                        background: "transparent", 
                        border: "1px solid var(--danger)",
                        color: "var(--danger)"
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Auction Items
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_1fr_380px]">
          {/* Attendees Panel */}
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center p-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-xl font-normal">Attendees</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddAttendee(!showAddAttendee)}
                  className="p-2 rounded-md transition-all"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <label 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload("attendees")} />
                </label>
              </div>
            </div>
            <div className="p-4 max-h-[75vh] overflow-y-auto">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search attendees..."
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-8 rounded-md text-sm"
                  style={{ 
                    background: "var(--bg-deep)", 
                    border: "1px solid var(--border)", 
                    color: "var(--text-primary)",
                    outline: "none"
                  }}
                />
                {attendeeSearch && (
                  <button 
                    onClick={() => setAttendeeSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Add Form */}
              {showAddAttendee && (
                <div className="p-4 rounded-lg mb-4" style={{ background: "var(--bg-elevated)" }}>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="First name"
                      value={newAttendee.firstName}
                      onChange={(e) => setNewAttendee({ ...newAttendee, firstName: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-md text-sm"
                      style={{ background: "var(--bg-deep)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
                    />
                    <input
                      type="text"
                      placeholder="Last name"
                      value={newAttendee.lastName}
                      onChange={(e) => setNewAttendee({ ...newAttendee, lastName: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-md text-sm"
                      style={{ background: "var(--bg-deep)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Table #"
                      value={newAttendee.tableNumber}
                      onChange={(e) => setNewAttendee({ ...newAttendee, tableNumber: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-md text-sm"
                      style={{ background: "var(--bg-deep)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
                    />
                    <button 
                      onClick={addAttendee}
                      className="px-4 py-2 rounded-md text-sm font-medium"
                      style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
                    >
                      Add
                    </button>
                    <button 
                      onClick={() => setShowAddAttendee(false)}
                      className="px-4 py-2 rounded-md text-sm font-medium"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              {filteredAttendees.length === 0 ? (
                <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                  <div className="text-5xl mb-4 opacity-50">👥</div>
                  <p>{data.attendees.length === 0 ? "No attendees yet" : "No matches found"}</p>
                  {data.attendees.length === 0 && (
                    <p className="text-sm mt-2">Upload a CSV or add manually</p>
                  )}
                </div>
              ) : (
                filteredAttendees.map(attendee => (
                  <div
                    key={attendee.id}
                    onClick={() => selectAttendee(attendee)}
                    className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all"
                    style={{
                      background: selectedAttendee?.id === attendee.id 
                        ? "rgba(39, 118, 234, 0.1)" 
                        : attendee.printed 
                          ? "var(--printed-bg)" 
                          : "var(--bg-elevated)",
                      border: `2px solid ${selectedAttendee?.id === attendee.id ? "var(--accent)" : "transparent"}`,
                      opacity: attendee.printed ? 0.5 : 1,
                      animation: "fadeIn 0.2s ease"
                    }}
                  >
                    <div 
                      className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        border: `2px solid ${selectedAttendee?.id === attendee.id ? "var(--accent)" : "var(--border)"}`,
                        background: selectedAttendee?.id === attendee.id ? "var(--accent)" : "transparent"
                      }}
                    >
                      {selectedAttendee?.id === attendee.id && (
                        <Check className="w-3 h-3" style={{ color: "var(--bg-deep)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-medium truncate"
                        style={{ 
                          color: attendee.printed ? "var(--printed-text)" : "var(--text-primary)",
                          textDecoration: attendee.printed ? "line-through" : "none"
                        }}
                      >
                        {attendee.firstName} {attendee.lastName}
                      </div>
                      <div 
                        className="text-xs"
                        style={{ 
                          color: attendee.printed ? "var(--printed-text)" : "var(--text-secondary)",
                          textDecoration: attendee.printed ? "line-through" : "none"
                        }}
                      >
                        Table {attendee.tableNumber}
                      </div>
                    </div>
                    {attendee.printed && (
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide"
                        style={{ background: "var(--success)", color: "var(--bg-deep)" }}
                      >
                        Printed
                      </span>
                    )}
                    <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      {attendee.printed && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); resetStatus("attendee", attendee.id) }}
                          className="p-1 rounded"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteAttendee(attendee.id) }}
                        className="p-1 rounded"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Packages Panel */}
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center p-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-xl font-normal">Auction Packages</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddPackage(!showAddPackage)}
                  className="p-2 rounded-md transition-all"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <label 
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload("packages")} />
                </label>
              </div>
            </div>
            <div className="p-4 max-h-[75vh] overflow-y-auto">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search packages..."
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-8 rounded-md text-sm"
                  style={{ 
                    background: "var(--bg-deep)", 
                    border: "1px solid var(--border)", 
                    color: "var(--text-primary)",
                    outline: "none"
                  }}
                />
                {packageSearch && (
                  <button 
                    onClick={() => setPackageSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Add Form */}
              {showAddPackage && (
                <div className="p-4 rounded-lg mb-4" style={{ background: "var(--bg-elevated)" }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Package name"
                      value={newPackageName}
                      onChange={(e) => setNewPackageName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-md text-sm"
                      style={{ background: "var(--bg-deep)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none" }}
                    />
                    <button 
                      onClick={addPackage}
                      className="px-4 py-2 rounded-md text-sm font-medium"
                      style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
                    >
                      Add
                    </button>
                    <button 
                      onClick={() => setShowAddPackage(false)}
                      className="px-4 py-2 rounded-md text-sm font-medium"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              {filteredPackages.length === 0 ? (
                <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                  <div className="text-5xl mb-4 opacity-50">🎁</div>
                  <p>{data.packages.length === 0 ? "No packages yet" : "No matches found"}</p>
                  {data.packages.length === 0 && (
                    <p className="text-sm mt-2">Upload a CSV or add manually</p>
                  )}
                </div>
              ) : (
                filteredPackages.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => togglePackage(pkg)}
                    className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all"
                    style={{
                      background: selectedPackages.some(p => p.id === pkg.id)
                        ? "rgba(39, 118, 234, 0.1)" 
                        : pkg.printed 
                          ? "var(--printed-bg)" 
                          : "var(--bg-elevated)",
                      border: `2px solid ${selectedPackages.some(p => p.id === pkg.id) ? "var(--accent)" : "transparent"}`,
                      opacity: pkg.printed ? 0.5 : 1,
                      animation: "fadeIn 0.2s ease"
                    }}
                  >
                    <div 
                      className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        border: `2px solid ${selectedPackages.some(p => p.id === pkg.id) ? "var(--accent)" : "var(--border)"}`,
                        background: selectedPackages.some(p => p.id === pkg.id) ? "var(--accent)" : "transparent"
                      }}
                    >
                      {selectedPackages.some(p => p.id === pkg.id) && (
                        <Check className="w-3 h-3" style={{ color: "var(--bg-deep)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="font-medium truncate"
                        style={{ 
                          color: pkg.printed ? "var(--printed-text)" : "var(--text-primary)",
                          textDecoration: pkg.printed ? "line-through" : "none"
                        }}
                      >
                        {pkg.name}
                      </div>
                    </div>
                    {pkg.printed && (
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide"
                        style={{ background: "var(--success)", color: "var(--bg-deep)" }}
                      >
                        Printed
                      </span>
                    )}
                    <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      {pkg.printed && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); resetStatus("package", pkg.id) }}
                          className="p-1 rounded"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); deletePackage(pkg.id) }}
                        className="p-1 rounded"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Print Panel */}
          <div className="rounded-xl overflow-hidden lg:sticky lg:top-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-xl font-normal">Print Label</h2>
            </div>
            <div className="p-4">
              {/* Selection Summary */}
              <div className="p-4 rounded-lg mb-4" style={{ background: "var(--bg-elevated)" }}>
                <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                  Winner
                </div>
                <div style={{ color: selectedAttendee ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {selectedAttendee ? (
                    `${selectedAttendee.firstName} ${selectedAttendee.lastName}`
                  ) : (
                    <span className="italic">Select an attendee</span>
                  )}
                </div>

                {selectedAttendee && (
                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                      Table
                    </div>
                    <div>{selectedAttendee.tableNumber || "N/A"}</div>
                  </div>
                )}

                {selectedPackages.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                      Packages Won
                    </div>
                    <div className="flex flex-wrap">
                      {selectedPackages.map(pkg => (
                        <span 
                          key={pkg.id}
                          className="inline-block px-2.5 py-1 rounded text-xs font-medium mr-1 mt-1"
                          style={{ background: "var(--accent)", color: "var(--bg-deep)" }}
                        >
                          {pkg.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Label Preview */}
              {canPrint && (
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                    Label Preview (2¼&quot; × 1¼&quot;)
                  </div>
                  <div 
                    className="w-full rounded p-3 flex flex-col justify-center"
                    style={{ 
                      aspectRatio: "2.25 / 1.25", 
                      background: "white",
                      color: "black",
                      fontFamily: "'Inter', system-ui, sans-serif"
                    }}
                  >
                    <div className="flex flex-wrap justify-between items-baseline gap-1 mb-1">
                      <div className="text-sm font-semibold">
                        {selectedAttendee?.firstName} {selectedAttendee?.lastName}
                        {totalLabels > 1 && ` (1/${totalLabels})`}
                      </div>
                      <div className="text-[11px] text-gray-500 whitespace-nowrap">
                        Table {selectedAttendee?.tableNumber || "N/A"}
                      </div>
                    </div>
                    <div className="h-px bg-gray-300 my-1.5"></div>
                    <div className="text-[10px] leading-tight">
                      {packageGroups[0]?.map(p => p.name).join(" | ")}
                    </div>
                    {totalLabels === 1 && (
                      <div className="text-[9px] font-semibold text-gray-500 mt-1.5 uppercase tracking-wide">
                        TOTAL ITEMS: {selectedPackages.length}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Print Button */}
              <button
                onClick={printLabel}
                disabled={!canPrint}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-md text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: canPrint ? "var(--accent)" : "var(--bg-elevated)", 
                  color: canPrint ? "var(--bg-deep)" : "var(--text-muted)" 
                }}
              >
                <Printer className="w-[18px] h-[18px]" />
                {totalLabels > 1 ? `Print ${totalLabels} Labels` : "Print Label"}
              </button>

              <button
                onClick={clearSelection}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-md text-base font-medium mt-2 transition-all"
                style={{ 
                  background: "var(--bg-elevated)", 
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)" 
                }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
