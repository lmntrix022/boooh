import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkAutomationTriggers } from "@/services/marketingAutomationService";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  checkAdminRole: () => Promise<boolean>;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
  isAdmin: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const isManuallySigningOutRef = useRef(false);
  const { toast } = useToast();
  const toastRef = useRef(toast);

  // Keep toast ref updated
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Initialize auth state
  useEffect(() => {
    let initTimeout: NodeJS.Timeout;
    let isInitialized = false;

    const initializeAuth = async () => {
      try {
        // Ne rien faire si déconnexion en cours
        if (isManuallySigningOutRef.current) {
          return;
        }

        // Initializing auth...
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        // Ignorer l'erreur "Invalid Refresh Token" au démarrage
        if (sessionError && !sessionError.message.includes('Invalid Refresh Token')) {
          // Error getting session
          throw sessionError;
        }

        if (session && !isManuallySigningOutRef.current) {
          // Session found for user

          // Initialiser sans vérifier le rôle admin pour accélérer le chargement
          // Le rôle sera vérifié en arrière-plan
          if (!isInitialized) {
            isInitialized = true;
            clearTimeout(initTimeout);
            setState(prev => ({
              ...prev,
              user: session.user,
              session,
              isAdmin: false, // Sera mis à jour après
              loading: false,
              initialized: true,
            }));
            // Initialization complete (fast mode)
          }

          // Vérifier le rôle admin en arrière-plan (ne bloque pas l'initialisation)
          (async () => {
            try {
              const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .eq('role', 'admin')
                .maybeSingle();

              if (error) {
                // Error checking admin role (background)
              } else {
                const isAdmin = !!data;
                // User is admin (background check)
                setState(prev => ({ ...prev, isAdmin }));
              }
            } catch (err) {
              // Exception checking admin role (background)
            }
          })();
        } else {
          // No session found
          if (!isInitialized) {
            isInitialized = true;
            clearTimeout(initTimeout);
            setState(prev => ({
              ...prev,
              loading: false,
              initialized: true,
            }));
          }
        }
      } catch (error) {
        // Error initializing auth
        if (!isInitialized) {
          isInitialized = true;
          clearTimeout(initTimeout);
          setState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      }
    };

    // Timeout de sécurité réduit : forcer l'initialisation après 3 secondes
    initTimeout = setTimeout(() => {
      if (!isInitialized) {
        // Initialization timeout - forcing initialized state
        isInitialized = true;
        setState(prev => ({
          ...prev,
          loading: false,
          initialized: true,
        }));
      }
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignorer TOUS les événements si déconnexion manuelle en cours
        if (isManuallySigningOutRef.current) {
          return;
        }

        // Skip initial SIGNED_IN event during initialization
        if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          return;
        }

        // Ignorer l'événement SIGNED_OUT entièrement
        if (event === 'SIGNED_OUT') {
          return;
        }

        let isAdmin = false;

        // Vérifier le rôle admin si l'utilisateur est connecté (sauf pour INITIAL_SESSION)
        if (session?.user && event !== 'SIGNED_IN' || (event === 'SIGNED_IN' && isInitialized)) {
          try {
            const roleCheckPromise = supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('role', 'admin')
              .maybeSingle();

            const timeoutPromise = new Promise((resolve) =>
              setTimeout(() => resolve({ data: null, error: new Error('Role check timeout') }), 2000)
            );

            const result: any = await Promise.race([roleCheckPromise, timeoutPromise]);

            if (result.error && result.error.message !== 'Role check timeout') {
              // Error checking admin role on state change
            } else if (result.data) {
              isAdmin = true;
            }
          } catch (error) {
            // Exception checking admin role on state change
          }
        }

        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
          isAdmin: session?.user ? isAdmin : false,
          loading: false,
        }));

        if (event === "SIGNED_IN" && isInitialized) {
          toast({
            title: "Connexion réussie",
            description: "Bienvenue sur Bööh!",
            variant: "success",
          });
        } else if (event === "SIGNED_OUT") {
          toast({
            title: "Déconnexion",
            description: "À bientôt!",
            variant: "info",
          });
        }
      }
    );

    initializeAuth();

    return () => {
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []); // Remove toast from dependencies to prevent infinite re-renders

  const handleAuthError = (error: AuthError | Error, action: string) => {
    // Auth error

    let errorMessage = "Une erreur est survenue. Veuillez réessayer.";

    if (error instanceof AuthError) {
      if (error.message.includes("Database error saving new user")) {
        errorMessage = "Erreur lors de la création du profil. Veuillez réessayer.";
      } else if (error.message.includes("User already registered")) {
        errorMessage = "Cette adresse email est déjà utilisée.";
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect.";
      } else if (error.message.includes("email rate limit exceeded") || error.message.includes("rate limit exceeded")) {
        errorMessage = "Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.";
      } else if (error.message.includes("Gateway Timeout") || error.message.includes("504")) {
        errorMessage = "Le serveur a mis trop de temps à répondre. Veuillez réessayer.";
      }
    }

    toast({
      title: `Erreur de ${action}`,
      description: errorMessage,
      variant: "destructive",
    });

    throw error;
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    setState(prev => ({ ...prev, loading: true }));

    try {

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata?.full_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) {
        // Auth error during signup
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No user data returned from signup");
      }

      // Le profil sera créé automatiquement par le trigger de base de données

      // Trigger onboarding email automation
      if (authData.user && authData.user.email) {
        checkAutomationTriggers(
          authData.user.id,    // contactId (UUID required)
          authData.user.id,    // userId
          'user_registered',
          {
            full_name: metadata?.full_name,
            email: authData.user.email // Pass email in data payload
          }
        ).catch(console.error);
      }

      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
      });
    } catch (error: any) {
      handleAuthError(error, "inscription");
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    // Réinitialiser le flag lors de la connexion manuelle
    isManuallySigningOutRef.current = false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      handleAuthError(error, "connexion");
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    // Activer le flag immédiatement
    isManuallySigningOutRef.current = true;

    // Nettoyer le state AVANT le signOut
    setState({
      user: null,
      session: null,
      loading: false,
      initialized: true,
      isAdmin: false,
    });

    // Déconnexion Supabase (fire and forget)
    supabase.auth.signOut().catch(() => { });

    // Rediriger IMMÉDIATEMENT sans délai
    window.location.href = '/auth';
  };

  const updatePassword = async (newPassword: string) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès.",
      });
    } catch (error: any) {
      handleAuthError(error, "mise à jour du mot de passe");
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const checkAdminRole = async (): Promise<boolean> => {
    if (!state.user?.id) return false;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', state.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        // Erreur de vérification du rôle admin
        return false;
      }

      const isAdmin = !!data;
      setState(prev => ({ ...prev, isAdmin }));
      return isAdmin;
    } catch (error) {
      // Erreur lors de la vérification du rôle
      return false;
    }
  };

  if (!state.initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        updatePassword,
        checkAdminRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
