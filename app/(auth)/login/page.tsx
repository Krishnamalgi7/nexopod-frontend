
import LoginForm from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
    return (
        <AuthLayout mode="login">
            <LoginForm />
        </AuthLayout>
    );
}
