"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import NavBar from "@/components/nav-bar";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

// Fetcher with Authorization header if token is present
const getAuthHeaders = () => {
  if (typeof window === "undefined") return { Authorization: "" };
  const token = localStorage.getItem("token");
  return { Authorization: token ? `Bearer ${token}` : "" };
};
const fetcher = (url: string) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export default function CustomerProfilePage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR(
    "/api/customer-profile/me",
    fetcher
  );
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Only initialize form when data changes and not yet initialized
  useEffect(() => {
    if (data?.data && !formInitialized) {
      setForm(data.data);
      setFormInitialized(true);
    }
  }, [data, formInitialized]);

  useEffect(() => {
    if (error) console.error("Profile fetch failed", error);
  }, [data, error]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer-profile/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditMode(false);
      setSaveSuccess(true);
      setFormInitialized(false); // allow form to re-init on SWR mutate
      mutate();
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert("Update failed. Please try again.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer-profile/${form.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      setDeleteConfirm(false);
      router.push("/goodbye-or-logout");
    } catch (err) {
      alert("Delete failed. Please try again.");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm(data.data);
    setFormInitialized(true);
    setEditMode(false);
  };

  if (isLoading) return <ProfileSkeleton />;
  if (error) return <ErrorState onRetry={() => mutate()} />;
  if (!data?.data) return <EmptyState />;

  const profile = data.data;
  const initials =
    (profile.firstName?.[0] || "").toUpperCase() +
    (profile.lastName?.[0] || "").toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* NavBar at the very top, no padding above */}
      <NavBar />

      {/* Add spacing below NavBar (not above) */}
      <div className="max-w-3xl mx-auto mt-10">
        {/* Card */}
        <div className="rounded-3xl shadow-2xl bg-white dark:bg-gray-800/80 overflow-hidden">
          {/* Colored header */}
          <div className="bg-blue-600 dark:bg-blue-900 py-8 px-6 flex flex-col items-center relative">
            <div className="absolute right-4 top-4">
              {saveSuccess && (
                <div className="flex items-center gap-1 bg-green-500/90 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Changes Saved!
                </div>
              )}
            </div>
            <div className="w-24 h-24 rounded-full bg-white dark:bg-blue-950 flex items-center justify-center text-4xl font-bold shadow-lg mb-2 border-4 border-blue-300 dark:border-blue-700">
              {initials || "?"}
            </div>
            <h1 className="text-2xl font-bold text-white mt-2">
              {profile.firstName ?? ""} {profile.lastName ?? ""}
            </h1>
          </div>

          <div className="p-8">
            {editMode ? (
              <EditForm
                form={form}
                saving={saving}
                onChange={handleChange}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <ProfileView
                profile={profile}
                onEdit={() => setEditMode(true)}
                onDelete={() => setDeleteConfirm(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmationModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
          saving={saving}
        />
      )}
    </div>
  );
}

// --- Subcomponents below ---

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse py-24">
      <div className="mb-8 text-center">
        <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-40 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-28 mx-auto"></div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-3xl p-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="mb-6">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
        <svg
          className="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Load Profile
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We couldn't load your profile information. Please check your
          connection and try again.
        </p>
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8">
        <svg
          className="w-16 h-16 text-yellow-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Profile Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn't find a profile associated with your account.
        </p>
      </div>
    </div>
  );
}

function ProfileView({
  profile,
  onEdit,
  onDelete,
}: {
  profile: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <dt className="w-full sm:w-1/3 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-0">
        {label}
      </dt>
      <dd className="w-full sm:w-2/3 text-gray-900 dark:text-white font-medium">
        {value || (
          <span className="text-gray-400 dark:text-gray-500">Not provided</span>
        )}
      </dd>
    </div>
  );

  return (
    <>
      <dl className="divide-y divide-gray-200 dark:divide-gray-700">
        <Field label="First Name" value={profile.firstName} />
        <Field label="Last Name" value={profile.lastName} />
        <Field label="Phone" value={profile.phone} />
        <Field label="Country" value={profile.country} />
        <Field label="NIC" value={profile.nic} />
        <Field
          label="Birthday"
          value={
            profile.birthDay
              ? new Date(profile.birthDay).toLocaleDateString()
              : ""
          }
        />
        <Field label="Address" value={profile.address} />
      </dl>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onEdit}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Profile
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Profile
        </button>
      </div>
    </>
  );
}

function EditForm({
  form,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  form: any;
  saving: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const InputField = ({
    label,
    name,
    type = "text",
    required = false,
  }: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
  }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={form[name] ?? ""}
          onChange={onChange}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
          rows={3}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={form[name] ?? ""}
          onChange={onChange}
          required={required}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
        />
      )}
    </div>
  );

  return (
    <form onSubmit={onSave}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="First Name" name="firstName" required />
        <InputField label="Last Name" name="lastName" required />
        <InputField label="Phone" name="phone" type="tel" />
        <InputField label="Country" name="country" />
        <InputField label="NIC" name="nic" />
        <InputField label="Birthday" name="birthDay" type="date" />
      </div>
      <InputField label="Address" name="address" type="textarea" />

      <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {saving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Save Changes
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function DeleteConfirmationModal({
  onConfirm,
  onCancel,
  saving,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Delete Profile
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete your profile? This action cannot be
            undone and all your data will be permanently removed.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
              </>
            ) : (
              "Delete Profile"
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
