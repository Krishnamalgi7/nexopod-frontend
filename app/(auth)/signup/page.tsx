import SignupForm from "@/components/auth/signupForm";
import AuthLayout from "@/components/auth/AuthLayout";

export default function SignupPage() {
    return (
        <AuthLayout mode="signup">
            <SignupForm />
        </AuthLayout>
    );
}