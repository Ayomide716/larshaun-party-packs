import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BookOpen, Loader2 } from "lucide-react";

export default function Login() {
    const { user, session } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    useEffect(() => {
        if (user || session) {
            navigate("/");
        }
    }, [user, session, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                toast.success("Successfully logged in");
                navigate("/");
            } else {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        }
                    }
                });
                if (error) throw error;
                toast.success("Account created successfully!");
                if (data.session) {
                    navigate("/");
                }
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred during authentication");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
            {/* Left Form Section */}
            <div className="flex items-center justify-center p-8">
                <div className="mx-auto w-full max-w-sm space-y-8">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-3">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
                                Posh Homewares
                            </h1>
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight">
                            {isLogin ? "Welcome back" : "Create an account"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {isLogin
                                ? "Enter your email to sign in to your workspace"
                                : "Enter your details to build your business OS"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        {!isLogin && (
                            <div className="space-y-2">
                                <Input
                                    id="fullName"
                                    placeholder="Full Name (e.g. John Doe)"
                                    type="text"
                                    autoCapitalize="words"
                                    autoComplete="name"
                                    autoCorrect="off"
                                    disabled={loading}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={loading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                id="password"
                                placeholder="Password"
                                type="password"
                                disabled={loading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full h-11 text-base font-medium" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLogin ? "Sign In" : "Sign Up"}
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-medium text-primary hover:underline"
                        >
                            {isLogin ? "Sign up" : "Sign in"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Hero Section */}
            <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]" style={{ backgroundImage: "radial-gradient(circle at 50% 120%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 font-medium text-primary-foreground/80">
                        <BookOpen className="h-5 w-5" />
                        <span>Posh Homewares OS</span>
                    </div>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg">
                    <h2 className="text-4xl font-display font-bold leading-tight">
                        Run your entire business from one place.
                    </h2>
                    <p className="text-lg text-primary-foreground/80 leading-relaxed">
                        Beautifully designed dashboard to track inventory, CRM, sales, and analytics with zero friction.
                    </p>
                </div>

                <div className="relative z-10 text-sm font-medium text-primary-foreground/60">
                    © {new Date().getFullYear()} Posh Homewares. All rights reserved.
                </div>
            </div>
        </div>
    );
}
