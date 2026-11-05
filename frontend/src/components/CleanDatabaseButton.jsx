import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export default function CleanDatabaseButton({ token }) {
  const [cleaning, setCleaning] = useState(false);

  async function handleCleanCourseNames() {
    if (!confirm('This will remove "Submitted answers:-" text from all course names in the database.\n\nContinue?')) {
      return;
    }

    setCleaning(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/util/clean-course-names`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`✅ Cleaned ${data.updated} course names!`);
      console.log('Cleaning result:', data);
      
      // Refresh page after 1 second
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Cleaning error:', error);
      toast.error('❌ Failed to clean course names: ' + (error.response?.data?.message || error.message));
    } finally {
      setCleaning(false);
    }
  }

  return (
    <button
      onClick={handleCleanCourseNames}
      disabled={cleaning}
      className="btn btn-warning flex items-center gap-2"
      title="Remove 'Submitted answers:-' from all course names"
    >
      <Trash2 size={16} />
      {cleaning ? 'Cleaning...' : 'Clean Course Names'}
    </button>
  );
}
