import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../providers/AuthProvider";

const schema = z.object({
  email: z.string().email("Email no válido"),
  password: z.string().min(6, "Ingrese su contraseña"),
});

type FormData = z.infer<typeof schema>;

export const LoginPage = () => {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@vitalminds.local",
      password: "Admin123!",
    },
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (values: FormData) => {
    setErrorMessage(null);
    try {
      await login(values);
    } catch (error) {
      console.error("Error de autenticación", error);
      setErrorMessage("No pudimos validar tus credenciales. Revisá el email/contraseña e intentá nuevamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">VitalMinds Clinic</h1>
          <p className="text-sm text-muted mt-2">Accedé con las credenciales demo para explorar el MVP.</p>
        </div>
        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white rounded-lg py-2 font-semibold hover:bg-blue-600 transition disabled:bg-slate-400"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
};
