"use client";

import { useEffect, useState, useRef } from "react";
import { useUserId, useUserEmail, useUserName, useUserImage } from "@/components/providers/UserProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Edit2,
  Save,
  X,
  CheckCircle2,
  BarChart3,
  Target,
  ListTodo,
  Clock,
  DollarSign,
  Bug,
  LifeBuoy,
  MessageSquare,
  Download,
  Shield,
  Crown,
  Zap,
  Camera,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  user: {
    id: string;
    email: string;
    name: string | null;
    given_name: string | null;
    family_name: string | null;
    image: string | null;
    plan: string;
    customerId: string | null;
    createdAt: string;
    updatedAt: string;
    isOAuthEmail: boolean;
  };
  subscription: {
    plan: string;
    period: string;
    startDate: string;
    endDate: string;
    duration: string;
  } | null;
  stats: {
    tasks: number;
    goals: number;
    pomotasks: number;
    transactions: number;
    bugReports: number;
    supportRequests: number;
    reviews: number;
  };
  accountAge: string;
}

export default function ProfilePage() {
  const userId = useUserId();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    given_name: "",
    family_name: "",
    email: "",
    image: "",
  });

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      setProfileData(data);
      
      // Preencher formulário com dados atuais
      setFormData({
        given_name: data.user.given_name || "",
        family_name: data.user.family_name || "",
        email: data.user.email || "",
        image: data.user.image || "",
      });
      setImagePreview(data.user.image);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        given_name: profileData.user.given_name || "",
        family_name: profileData.user.family_name || "",
        email: profileData.user.email || "",
        image: profileData.user.image || "",
      });
      setImagePreview(profileData.user.image);
      setImageFile(null);
      setImageUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setIsEditing(false);
    setIsEditingImage(false);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      setImageUrl("");
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setImageUrl(url);
    if (url) {
      setImagePreview(url);
      setImageFile(null);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveImage = async () => {
    setIsSaving(true);
    try {
      let imageToSave: string | null = null;

      if (imageFile) {
        // Converter arquivo para base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result as string;
          await updateProfileImage(base64Image);
        };
        reader.readAsDataURL(imageFile);
        return; // A atualização será feita no callback
      } else if (imageUrl.trim()) {
        imageToSave = imageUrl.trim();
      } else if (!imagePreview) {
        imageToSave = null; // Remover imagem
      } else {
        // Manter imagem atual
        setIsEditingImage(false);
        setIsSaving(false);
        return;
      }

      await updateProfileImage(imageToSave);
    } catch (error: any) {
      console.error("Error saving image:", error);
      toast.error(error.message || "Failed to update profile image");
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfileImage = async (image: string | null) => {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update profile image");
    }

    toast.success("Profile image updated successfully!");
    setIsEditingImage(false);
    setImageFile(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await fetchProfile(); // Recarregar dados
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const name = `${formData.given_name.trim()} ${formData.family_name.trim()}`.trim();
      
      const updateData: any = { name };
      
      // Só atualizar email se não for OAuth
      if (!profileData?.user.isOAuthEmail) {
        updateData.email = formData.email.trim();
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      await fetchProfile(); // Recarregar dados
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info("Preparing your data export...");
      const response = await fetch("/api/account/export");
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `goaldigger-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "pro":
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case "plus":
        return <Zap className="w-5 h-5 text-blue-500" />;
      default:
        return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "pro":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "plus":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">Failed to load profile data</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-neutral-400">Manage your account information and preferences</p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit} variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
            <div className="flex items-start gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-neutral-600">
                  <AvatarImage src={imagePreview || profileData.user.image || undefined} />
                  <AvatarFallback className="bg-neutral-700 text-xl">
                    {profileData.user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!isEditingImage && (
                  <button
                    onClick={() => setIsEditingImage(true)}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit profile picture"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                {/* Image Editing Section */}
                {isEditingImage && (
                  <div className="mb-6 p-4 bg-neutral-900 rounded-lg border border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Edit Profile Picture</h3>
                      <button
                        onClick={() => {
                          setIsEditingImage(false);
                          setImageFile(null);
                          setImageUrl("");
                          setImagePreview(profileData.user.image);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Upload Image
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        />
                        <p className="mt-1 text-xs text-neutral-500">
                          Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-neutral-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-neutral-900 text-neutral-400">OR</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={handleImageUrlChange}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {imagePreview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-neutral-300 mb-2">Preview</p>
                          <div className="relative inline-block">
                            <Avatar className="w-32 h-32 border-2 border-neutral-600">
                              <AvatarImage src={imagePreview} />
                              <AvatarFallback className="bg-neutral-700 text-xl">
                                {profileData.user.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <button
                              onClick={handleRemoveImage}
                              className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                              title="Remove image"
                            >
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveImage}
                          disabled={isSaving || (!imageFile && !imageUrl && imagePreview === profileData.user.image)}
                          className="gap-2"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Image
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingImage(false);
                            setImageFile(null);
                            setImageUrl("");
                            setImagePreview(profileData.user.image);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          variant="outline"
                          disabled={isSaving}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.given_name}
                          onChange={(e) =>
                            setFormData({ ...formData, given_name: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="First Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.family_name}
                          onChange={(e) =>
                            setFormData({ ...formData, family_name: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Email
                        {profileData.user.isOAuthEmail && (
                          <span className="ml-2 text-xs text-yellow-400">
                            (Managed by OAuth provider)
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={profileData.user.isOAuthEmail}
                        className={`w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          profileData.user.isOAuthEmail
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder="Email"
                      />
                      {profileData.user.isOAuthEmail && (
                        <p className="mt-1 text-xs text-neutral-500">
                          To change your email, update it in your OAuth provider settings
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        disabled={isSaving}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {profileData.user.name || "No name set"}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getPlanBadgeColor(
                            profileData.user.plan
                          )}`}
                        >
                          <div className="flex items-center gap-2">
                            {getPlanIcon(profileData.user.plan)}
                            <span className="capitalize">{profileData.user.plan}</span> Plan
                          </div>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-neutral-300">
                        <Mail className="w-4 h-4" />
                        <span>{profileData.user.email}</span>
                        {profileData.user.isOAuthEmail && (
                          <span className="text-xs text-yellow-400">(OAuth)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-neutral-300">
                        <Calendar className="w-4 h-4" />
                        <span>Member for {profileData.accountAge}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          {profileData.subscription && (
            <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Subscription</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Plan</p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {profileData.subscription.plan} ({profileData.subscription.period})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-white">
                    {profileData.subscription.duration}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Start Date</p>
                  <p className="text-white">
                    {new Date(profileData.subscription.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">End Date</p>
                  <p className="text-white">
                    {new Date(profileData.subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Statistics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <ListTodo className="w-4 h-4 text-blue-400" />
                  <p className="text-sm text-neutral-400">Tasks</p>
                </div>
                <p className="text-2xl font-bold text-white">{profileData.stats.tasks}</p>
              </div>
              <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-neutral-400">Goals</p>
                </div>
                <p className="text-2xl font-bold text-white">{profileData.stats.goals}</p>
              </div>
              <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <p className="text-sm text-neutral-400">Pomodoro Tasks</p>
                </div>
                <p className="text-2xl font-bold text-white">{profileData.stats.pomotasks}</p>
              </div>
              <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm text-neutral-400">Transactions</p>
                </div>
                <p className="text-2xl font-bold text-white">{profileData.stats.transactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">User ID</span>
                <span className="text-xs text-neutral-500 font-mono">
                  {profileData.user.id.slice(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Account Created</span>
                <span className="text-sm text-white">
                  {new Date(profileData.user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Last Updated</span>
                <span className="text-sm text-white">
                  {new Date(profileData.user.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-neutral-400">Bug Reports</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {profileData.stats.bugReports}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-neutral-400">Support Requests</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {profileData.stats.supportRequests}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-neutral-400">Reviews</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {profileData.stats.reviews}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Download className="w-4 h-4" />
                Export My Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

