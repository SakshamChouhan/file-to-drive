import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

interface User {
  id: number;
  displayName: string;
  email: string;
  role: string;
  isAdmin: boolean;
  profilePicture?: string;
}

interface Document {
  id: number;
  title: string;
  userId: number;
  lastSaved: string;
  isInDrive: boolean;
}

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");

  // Redirect non-admin users
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      return data as User[];
    },
  });

  // Fetch all documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["/api/admin/documents"],
    queryFn: async () => {
      const response = await fetch("/api/admin/documents", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      return data as Document[];
    },
  });

  // Update user role mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; isAdmin: boolean }) => {
      const response = await fetch(`/api/admin/users/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isAdmin: data.isAdmin })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  });

  const handleToggleAdmin = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      isAdmin: !user.isAdmin
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="documents">View Documents</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                Manage user roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-4">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Admin Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {user.profilePicture && (
                              <img
                                src={user.profilePicture}
                                alt={user.displayName}
                                className="w-8 h-8 rounded-full"
                              />
                            )}
                            <span>{user.displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.isAdmin ? "default" : "outline"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.isAdmin}
                            onCheckedChange={() => handleToggleAdmin(user)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>
                View and manage all documents in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex justify-center py-4">Loading documents...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Last Saved</TableHead>
                      <TableHead>Drive Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">{document.title}</TableCell>
                        <TableCell>{document.userId}</TableCell>
                        <TableCell>{new Date(document.lastSaved).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={document.isInDrive ? "default" : "outline"}>
                            {document.isInDrive ? "In Drive" : "Local Only"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>
                Overview of system usage and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{users.length}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{documents.length}</div>
                  <div className="text-sm text-muted-foreground">Total Documents</div>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-2xl font-bold">
                    {documents.filter(d => d.isInDrive).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Documents in Drive</div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Admin Users</h3>
                <div className="flex flex-wrap gap-2">
                  {users
                    .filter(user => user.isAdmin)
                    .map(admin => (
                      <Badge key={admin.id} variant="secondary">
                        {admin.displayName}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}