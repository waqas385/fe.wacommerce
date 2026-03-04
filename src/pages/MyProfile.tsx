import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, ArrowLeft, Mail, Phone, Calendar, Lock, Key, Eye, EyeOff, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { authService } from '@/services/auth';

interface UserProfile {
  email: string;
  fullName: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  lastLoginAt: string;
  createdAt: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [editableProfile, setEditableProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      // Fetch user profile from your service
      const response = await authService.getUserProfile();
      
      setProfile(response);
      setEditableProfile(response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editableProfile) {
      setEditableProfile({
        ...editableProfile,
        [name]: value
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (): boolean => {
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleUpdateProfile = async () => {
    if (!editableProfile) return;
    
    try {
      setUpdating(true);
      await authService.updateUserProfile(editableProfile);
      setProfile(editableProfile);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    
    try {
      setUpdating(true);
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Reset form on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password changed successfully');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Display the error message from the service
      toast.error(error.message || 'Failed to change password');
      
      // If it's an auth error (401), you might want to redirect to login
      if (error.status === 401) {
        // Optional: Redirect to login after a delay
        setTimeout(() => {
          // navigate to login
        }, 3000);
      }
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cancelEdit = () => {
    setEditableProfile(profile);
    setEditMode(false);
  };

  if (!user) {
    return (
      <div className="py-16 md:py-24">
        <div className="container-store text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Sign in to view your profile</h1>
          <p className="text-muted-foreground mb-6">
            Access your profile information and settings
          </p>
          <Link to="/auth">
            <Button className="bg-gradient-accent">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-8 md:py-12">
        <div className="container-store">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 bg-muted rounded-xl">
                <div className="h-6 bg-muted-foreground/20 rounded w-1/4 mb-4" />
                <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container-store">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="section-heading mb-8">My Profile</h1>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            {/* Profile Header */}
            <div className="p-4 md:p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">
                    {profile?.fullName || 'User Profile'}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              {!editMode && (
                <Button 
                  variant="outline" 
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Profile Content */}
            <div className="p-4 md:p-6">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="info">Personal Information</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </Label>
                      {editMode ? (
                        <Input
                          name="email"
                          value={editableProfile?.email || ''}
                          onChange={handleInputChange}
                          type="email"
                          disabled
                          className="bg-muted"
                        />
                      ) : (
                        <p className="font-medium">{profile?.email}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </Label>
                      {editMode ? (
                        <Input
                          name="fullName"
                          value={editableProfile?.fullName || ''}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <p className="font-medium">{profile?.fullName}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                      {editMode ? (
                        <Input
                          name="phoneNumber"
                          value={editableProfile?.phoneNumber || ''}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                        />
                      ) : (
                        <p className="font-medium">{profile?.phoneNumber || 'Not provided'}</p>
                      )}
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        WhatsApp Number
                      </Label>
                      {editMode ? (
                        <Input
                          name="whatsappNumber"
                          value={editableProfile?.whatsappNumber || ''}
                          onChange={handleInputChange}
                          placeholder="Enter your WhatsApp number"
                        />
                      ) : (
                        <p className="font-medium">{profile?.whatsappNumber || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Account Information
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">{formatDate(profile?.createdAt || '')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Login</p>
                        <p className="font-medium">{formatDate(profile?.lastLoginAt || '')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Mode Actions */}
                  {editMode && (
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={updating}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={updating}
                        className="bg-gradient-accent"
                      >
                        {updating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Change Password
                      </CardTitle>
                      <CardDescription>
                        Ensure your account is secure by using a strong password
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Current Password */}
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            name="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            autoComplete="off"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            autoComplete="new-password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 8 characters long
                        </p>
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="pr-10"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex justify-end">
                        <Button
                          onClick={handleChangePassword}
                          disabled={updating || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                          className="bg-gradient-accent"
                        >
                          {updating ? 'Changing Password...' : 'Change Password'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;