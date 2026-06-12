import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

// ======================== LoginPage ========================
export function LoginPage() {
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form.usernameOrEmail, form.password);
      toast.success('Đăng nhập thành công!');
      navigate('/chat');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.data && typeof data.data === 'object') {
        const errorMessages = Object.values(data.data).join(', ');
        toast.error(`${data.message}: ${errorMessages}`);
      } else {
        toast.error(data?.message || 'Đăng nhập thất bại');
      }
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng trở lại! Tiếp tục học CTDL&GT"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Username hoặc Email"
          value={form.usernameOrEmail}
          onChange={(v) => setForm((f) => ({ ...f, usernameOrEmail: v }))}
          placeholder="username hoặc email@example.com"
        />
        <Field
          label="Mật khẩu"
          type={showPw ? 'text' : 'password'}
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          placeholder="••••••••"
          suffix={
            <button type="button" onClick={() => setShowPw((v) => !v)} className="text-gray-500 hover:text-gray-300">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          Đăng nhập
        </button>

        <p className="text-center text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// ======================== RegisterPage ========================
export function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '',
  });
  const [showPw, setShowPw] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success('Đăng ký thành công! Bắt đầu học ngay.');
      navigate('/chat');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.data && typeof data.data === 'object') {
        const errorMessages = Object.values(data.data).join(', ');
        toast.error(`${data.message}: ${errorMessages}`);
      } else {
        toast.error(data?.message || 'Đăng ký thất bại');
      }
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Bắt đầu hành trình học CTDL&GT với AI"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Username"
            value={form.username}
            onChange={(v) => setForm((f) => ({ ...f, username: v }))}
            placeholder="nguyenvan"
          />
          <Field
            label="Họ tên"
            value={form.fullName}
            onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          placeholder="email@example.com"
        />
        <Field
          label="Mật khẩu"
          type={showPw ? 'text' : 'password'}
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          placeholder="Tối thiểu 6 ký tự"
          suffix={
            <button type="button" onClick={() => setShowPw((v) => !v)} className="text-gray-500 hover:text-gray-300">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          Tạo tài khoản
        </button>

        <p className="text-center text-sm text-gray-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// ---- Shared AuthLayout ----
function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>

        {children}
      </motion.div>
    </div>
  );
}

// ---- Reusable form field ----
interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  suffix?: React.ReactNode;
}

function Field({ label, value, onChange, type = 'text', placeholder, suffix }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors pr-10"
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
    </div>
  );
}