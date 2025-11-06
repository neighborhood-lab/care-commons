import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useAuthService } from '@/core/hooks';
import { Button, Input } from '@/core/components';
import { PasswordInput } from '@/core/components/forms/PasswordInput';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const authService = useAuthService();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      login(response.user, response.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 animate-in zoom-in duration-300">
            Care Commons
          </h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 animate-in slide-in-from-bottom-2 duration-500 delay-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-base text-gray-600 animate-in slide-in-from-bottom-2 duration-500 delay-200">
            Enter your credentials to access the platform
          </p>
        </div>

        {/* Demo Credentials Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm animate-in slide-in-from-bottom-2 duration-500 delay-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-blue-900">Demo Credentials</h3>
              <p className="mt-2 text-sm text-blue-700">
                Email: <span className="font-mono font-semibold">admin@carecommons.example</span><br />
                Password: <span className="font-mono font-semibold">Admin123!</span>
              </p>
              <p className="mt-3 text-xs text-blue-600">
                Try the platform with sample data. <a href="https://neighborhood-lab.github.io/care-commons/" className="underline hover:text-blue-800 transition-colors" target="_blank" rel="noopener noreferrer">View Interactive Showcase</a>
              </p>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6 animate-in slide-in-from-bottom-2 duration-500 delay-400" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <Input
              {...register('email')}
              type="email"
              label="Email address"
              placeholder="you@example.com"
              {...(errors.email?.message !== undefined && { error: errors.email.message })}
              autoComplete="email"
              required
            />
            <PasswordInput
              {...register('password')}
              label="Password"
              placeholder="••••••••"
              {...(errors.password?.message !== undefined && { error: errors.password.message })}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
              />
              <label
                htmlFor="remember-me"
                className="ml-3 block text-sm text-gray-900 select-none"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors underline-offset-2 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full min-h-[48px] text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
};
