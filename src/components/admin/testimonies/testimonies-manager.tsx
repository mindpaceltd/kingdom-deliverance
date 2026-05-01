"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2, Video, Image as ImageIcon, ExternalLink, Loader2 } from "lucide-react";

export function TestimoniesManager() {
  const [testimonies, setTestimonies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTestimonies = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("testimonies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching testimonies:", error);
      } else {
        setTestimonies(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("testimonies")
        .update({ status: "approved" })
        .eq("id", id);

      if (error) throw error;
      setTestimonies(prev => 
        prev.map(t => t.id === id ? { ...t, status: "approved" } : t)
      );
    } catch (err) {
      console.error("Error approving testimony:", err);
      alert("Failed to approve testimony.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this testimony?")) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("testimonies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setTestimonies(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting testimony:", err);
      alert("Failed to delete testimony.");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Submitter</TableHead>
              <TableHead className="w-[30%]">Testimony</TableHead>
              <TableHead>Media</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  No testimonies found. Note: Ensure the 'testimonies' table is created in Supabase.
                </TableCell>
              </TableRow>
            ) : (
              testimonies.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-primary">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.phone}</div>
                    {t.email && <div className="text-xs text-muted-foreground">{t.email}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm line-clamp-3 text-muted-foreground" title={t.message}>
                      {t.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.media_url ? (
                      <a href={t.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                        <ExternalLink className="w-3 h-3" /> View Media
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {t.status === "approved" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {t.status !== "approved" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(t.id)}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
