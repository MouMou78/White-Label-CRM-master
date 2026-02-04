import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Shield, ShieldOff, RotateCcw } from "lucide-react";

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: users = [], isLoading } = trpc.admin.listUsers.useQuery();
  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate();
      alert("User role updated");
    },
  });

  const toggleUserMutation = trpc.admin.toggleUserStatus.useMutation({
    onSuccess: () => {
      utils.admin.listUsers.invalidate();
    },
  });

  const reset2FAMutation = trpc.admin.resetUser2FA.useMutation({
    onSuccess: () => {
      alert("2FA reset successfully. User will need to set up 2FA again on next login.");
    },
  });

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              {users.length} total users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "—"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(role) =>
                            updateRoleMutation.mutate({ userId: user.id, role })
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? (
                          <Badge variant="default">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.disabled ? (
                          <Badge variant="destructive">Disabled</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleUserMutation.mutate({ userId: user.id })
                            }
                          >
                            {user.disabled ? (
                              <>
                                <Shield className="h-4 w-4 mr-1" />
                                Enable
                              </>
                            ) : (
                              <>
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Disable
                              </>
                            )}
                          </Button>
                          {user.twoFactorEnabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Reset 2FA for this user?")) {
                                  reset2FAMutation.mutate({ userId: user.id });
                                }
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reset 2FA
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u: any) => !u.disabled).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u: any) => u.role === "admin").length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
