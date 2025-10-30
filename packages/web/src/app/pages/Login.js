"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Login = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_hook_form_1 = require("react-hook-form");
const zod_1 = require("@hookform/resolvers/zod");
const zod_2 = require("zod");
const hooks_1 = require("@/core/hooks");
const components_1 = require("@/core/components");
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
const loginSchema = zod_2.z.object({
    email: zod_2.z.string().email('Invalid email address'),
    password: zod_2.z.string().min(6, 'Password must be at least 6 characters'),
});
const Login = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { login } = (0, hooks_1.useAuth)();
    const authService = (0, hooks_1.useAuthService)();
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const { register, handleSubmit, formState: { errors }, } = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(loginSchema),
    });
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await authService.login(data);
            login(response.user, response.token);
            react_hot_toast_1.default.success('Welcome back!');
            navigate('/');
        }
        catch (error) {
            react_hot_toast_1.default.error(error.message || 'Login failed');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center text-primary-600">
            Care Commons
          </h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access the platform
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <components_1.Input {...register('email')} type="email" label="Email address" placeholder="you@example.com" error={errors.email?.message} autoComplete="email" required/>
            <components_1.Input {...register('password')} type="password" label="Password" placeholder="••••••••" error={errors.password?.message} autoComplete="current-password" required/>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"/>
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <components_1.Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
            Sign in
          </components_1.Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"/>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Demo Credentials</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <p>Admin: admin@example.com / password123</p>
            <p>Coordinator: coordinator@example.com / password123</p>
            <p>Caregiver: caregiver@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>);
};
exports.Login = Login;
//# sourceMappingURL=Login.js.map