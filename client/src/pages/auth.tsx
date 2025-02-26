import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertUser, loginSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");

  const form = useForm<InsertUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobileNumber: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/login", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials.",
      });
      setMode("login");
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    if (mode === "login") {
      loginMutation.mutate(data);
    } else {
      registerMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Doctor Appointment System</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="Enter your 10-digit mobile number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || registerMutation.isPending}
                >
                  {mode === "login" 
                    ? (loginMutation.isPending ? "Logging in..." : "Login")
                    : (registerMutation.isPending ? "Registering..." : "Register")}
                </Button>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}