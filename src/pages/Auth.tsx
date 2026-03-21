import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Bot,
  CalendarClock,
  ArrowRight,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TermsConsent } from '@/components/payment/TermsConsent';
import { motion, AnimatePresence } from "framer-motion";

const Mini3DOmlaut = React.lazy(() => import('@/components/auth/Mini3DOmlaut'));

interface FormState {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  terms?: string;
}


const Auth: React.FC = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Récupérer les paramètres d'URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteEmail = urlParams.get('email');
  const mode = urlParams.get('mode');

  const [formState, setFormState] = useState<FormState>({
    email: inviteEmail || "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const journeySteps = useMemo(
    () => [
      {
        title: t('auth.journeySteps.instantExperience'),
        description: t('auth.journeySteps.instantExperienceDesc'),
      },
      {
        title: t('auth.journeySteps.automaticTracking'),
        description: t('auth.journeySteps.automaticTrackingDesc'),
      },
    ],
    [t]
  );

  const featureBullets = useMemo(
    () => [
      t('auth.journeySteps.flagshipCards'),
    ],
    [t]
  );

  const testimonials = useMemo(
    () => [
      {
        quote:
          'Une URL partagée, tout notre suivi aligné. Les clients signent plus vite.',
        author: 'Mélissa Kouadio',
        role: 'Head of Client Success · HUB214',
      },
    ],
    []
  );

  // Si on a un mode depuis l'URL, ajuster l'onglet
  useEffect(() => {
    if (mode === 'signup') {
      setActiveTab('register');
    }
  }, [mode]);

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (isRegister: boolean): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formState.email) {
      errors.email = t('auth.emailRequired');
      isValid = false;
    } else if (!validateEmail(formState.email)) {
      errors.email = t('auth.emailInvalid');
      isValid = false;
    }

    if (!formState.password) {
      errors.password = t('auth.passwordRequired');
      isValid = false;
    } else if (isRegister && formState.password.length < 6) {
      errors.password = t('auth.passwordTooShort');
      isValid = false;
    }

    if (isRegister) {
      if (!formState.fullName) {
        errors.fullName = t('auth.nameRequired');
        isValid = false;
      }

      if (!formState.confirmPassword) {
        errors.confirmPassword = t('auth.confirmPasswordRequired');
        isValid = false;
      } else if (formState.password !== formState.confirmPassword) {
        errors.confirmPassword = t('auth.passwordsDoNotMatch');
        isValid = false;
      }

      if (!acceptTerms) {
        errors.terms = t('auth.termsRequired');
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm(activeTab === "register")) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === "login") {
        await signIn(formState.email, formState.password);
        toast({
          title: t('auth.signInSuccess'),
          description: t('auth.signInSuccessDesc'),
        });
        navigate("/dashboard");
      } else {
        // Inscription normale
        await signUp(
          formState.email,
          formState.password,
          { full_name: formState.fullName || "" }
        );

        // Ne pas naviguer automatiquement après inscription
        // L'utilisateur doit vérifier son email
        // Un toast sera affiché par le AuthContext
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('errors.errorOccurred'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Background Pattern - Subtle */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.05),transparent_50%)]" />

      {/* Navigation Button */}
      <motion.button
        onClick={() => navigate("/")}
        className="fixed left-4 top-4 z-30 rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm px-4 py-2 shadow-sm transition-all hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 md:left-8 md:top-8"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ArrowLeft className="h-4 w-4 text-gray-600" />
      </motion.button>

      <div className="relative z-20 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16 sm:py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Left Section - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              {t('auth.platformName')}
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
                {t('auth.premiumCockpit')}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-gray-600 md:text-xl">
                {t('auth.features')}
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4 rounded-2xl border border-gray-100 bg-white/50 backdrop-blur-sm p-8 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{t('auth.expressJourney')}</p>
              <ul className="space-y-3">
                {journeySteps.map((step) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="mt-1 h-2 w-2 flex-none rounded-full bg-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-900">{step.title}</p>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </li>
                ))}
                {featureBullets.map((bullet) => (
                  <li key={bullet} className="flex gap-4">
                    <div className="mt-1 h-2 w-2 flex-none rounded-full bg-blue-500" />
                    <span className="text-gray-700">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Right Section - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md">
              {/* Background decoration */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl" />
              <div className="absolute -inset-2 bg-white/80 backdrop-blur-sm rounded-2xl" />

              {/* Main Card */}
              <div className="relative rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-sm p-6 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                      <Sparkles className="h-3 w-3 text-blue-500" />
                      {t('auth.accessBooh')}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {activeTab === "login"
                        ? t('auth.connectCockpit')
                        : t('auth.inviteTeam')}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {activeTab === "login"
                        ? t('auth.connectCockpitDesc')
                        : t('auth.inviteTeamDesc')}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <React.Suspense fallback={<div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}>
                      <Mini3DOmlaut />
                    </React.Suspense>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50/50 px-3 py-2 text-sm text-green-700">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  {t('auth.secureAuth')}
                </div>

                {/* Tab Navigation */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <div className="flex gap-1">
                    {["login", "register"].map((tab) => (
                      <motion.button
                        key={tab}
                        onClick={() => {
                          setActiveTab(tab as "login" | "register");
                          setFormErrors({});
                        }}
                        className={`relative flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${activeTab === tab
                          ? "text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {activeTab === tab && (
                          <motion.div
                            layoutId="authTab"
                            className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        <span className="relative z-10">
                          {tab === "login" ? t('auth.signIn') : t('auth.signUp')}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <AnimatePresence mode="wait">
                    {activeTab === "register" && (
                      <motion.div
                        key="fullName"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1"
                      >
                        <label className="text-sm font-medium text-white/80">{t('auth.fullName')}</label>
                        <div className="group relative">
                          <UserIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                          <input
                            type="text"
                            name="fullName"
                            value={formState.fullName}
                            onChange={handleInputChange}
                            placeholder={t('auth.yourName')}
                            className={`w-full rounded-xl border bg-white px-12 py-3.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.fullName ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200"
                              }`}
                          />
                        </div>
                        {formErrors.fullName && (
                          <p className="flex items-center gap-2 text-xs text-red-600 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {formErrors.fullName}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div
                    key="email"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    <label className="text-sm font-medium text-white/80">{t('auth.email')}</label>
                    <div className="group relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                      <input
                        type="email"
                        name="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        placeholder={t('auth.emailPlaceholder')}
                        className={`w-full rounded-xl border bg-white px-12 py-3.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.email ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200"
                          }`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="flex items-center gap-2 text-xs text-red-600 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        {formErrors.email}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    key="password"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <label className="font-medium text-gray-700">{t('auth.password')}</label>
                      <span className="text-xs text-gray-500">{t('auth.passwordHint')}</span>
                    </div>
                    <div className="group relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formState.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className={`w-full rounded-xl border bg-white px-12 py-3.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.password ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200"
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="flex items-center gap-2 text-xs text-red-600 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        {formErrors.password}
                      </p>
                    )}
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {activeTab === "register" && (
                      <motion.div
                        key="confirmPassword"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-medium text-gray-700">{t('auth.confirmPassword')}</label>
                        <div className="group relative">
                          <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formState.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            className={`w-full rounded-xl border bg-white px-12 py-3.5 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${formErrors.confirmPassword ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" : "border-gray-200"
                              }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {formErrors.confirmPassword && (
                          <p className="flex items-center gap-2 text-xs text-red-600 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {formErrors.confirmPassword}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Terms and Conditions Toggle - Only for registration */}
                  <AnimatePresence mode="wait">
                    {activeTab === "register" && (
                      <motion.div
                        key="terms-consent"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div className="text-sm">
                              <Label
                                htmlFor="terms-toggle"
                                className="text-gray-700 cursor-pointer font-medium"
                              >
                                J'accepte les{' '}
                                <Link
                                  to="/terms"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  conditions générales
                                </Link>
                                {' '}et la{' '}
                                <Link
                                  to="/privacy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  politique de confidentialité
                                </Link>
                              </Label>
                            </div>
                          </div>
                          <Switch
                            id="terms-toggle"
                            checked={acceptTerms}
                            onCheckedChange={setAcceptTerms}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                        {formErrors.terms && (
                          <p className="flex items-center gap-2 text-xs text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {formErrors.terms}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting || (activeTab === "register" && !acceptTerms)}
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{activeTab === "login" ? t('auth.connecting') : t('auth.creatingAccount')}</span>
                      </>
                    ) : (
                      <>
                        <span>{activeTab === "login" ? t('auth.connect') : t('auth.createAccount')}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    {t('auth.multiCountry')}
                  </p>
                </form>

                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mt-4 text-center text-sm text-gray-600"
                >
                  {activeTab === "login" ? t('auth.notYetAccount') : t('auth.alreadyClient')}{" "}
                  <button
                    onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
                    className="font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    {activeTab === "login" ? t('auth.createAccess') : t('auth.connect')}
                  </button>
                </motion.p>
              </div>

              <div className="mt-4 flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  {t('auth.dataSecurity')}
                </div>
                <a href="mailto:support@booh.app" className="font-medium text-blue-600 transition hover:text-blue-800">
                  support@booh.app
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
