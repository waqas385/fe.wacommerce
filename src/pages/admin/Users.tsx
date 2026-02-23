import React, { useEffect, useState } from 'react';
import { Search, Shield, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import usersService, { UserProfile } from '@/services/users';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []); // Remove pagination dependencies since backend doesn't support it yet

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usersData = await usersService.getUsers({
        search: searchQuery || undefined,
      });
      
      setUsers(usersData || []);
      setFilteredUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      toast.error('Failed to load users');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: 'admin' | 'customer') => {
    try {
      const response = await usersService.updateUserRole(userId, { role: newRole });
      toast.success(response.message || 'User role updated successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredUsers(users);
    setCurrentPage(1);
  };

  // Pagination logic
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-accent/20 text-accent">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case 'customer':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
            Customer
          </Badge>
        );
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const hasUsers = filteredUsers && filteredUsers.length > 0;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">{filteredUsers.length} registered users</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-md mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
            disabled={loading}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          Search
        </Button>
        {searchQuery && (
          <Button onClick={handleClearSearch} variant="ghost" size="sm" disabled={loading}>
            Clear
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
          <p>{error}</p>
          <Button 
            onClick={fetchUsers} 
            variant="outline" 
            size="sm" 
            className="mt-2"
            disabled={loading}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
          </div>
        ) : hasUsers ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{user.fullName || 'No name'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.phoneNumber && (
                              <p className="text-xs text-muted-foreground">{user.phoneNumber}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'} className={user.isActive ? 'bg-green-500/20 text-green-500' : ''}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value as 'admin' | 'customer')}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No users found matching your search' : 'No users found'}
            </p>
            {searchQuery && (
              <Button onClick={handleClearSearch} variant="link" className="mt-2">
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;