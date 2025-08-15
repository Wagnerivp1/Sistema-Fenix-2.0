
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { getUsers, saveUser, saveSessionToken, getSessionToken } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loginUsername, setLoginUsername] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  
  const [registerUsername, setRegisterUsername] = React.useState('');
  const [registerPassword, setRegisterPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Garante que os usuários padrão sejam criados na primeira visita
    getUsers(); 
    
    // Se já existe um token, redireciona para o dashboard
    if (getSessionToken()) {
        router.replace('/dashboard');
    } else {
        setIsLoading(false);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const users = await getUsers();
      const user = users.find(u => u.username === loginUsername);

      const encodedPassword = btoa(loginPassword);

      if (user && user.password === encodedPassword) {
        const sessionToken = `TOKEN-${Date.now()}-${Math.random()}`;
        saveSessionToken(sessionToken);
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o dashboard...',
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Credenciais inválidas',
          description: 'Por favor, verifique seu usuário e senha.',
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: 'Ocorreu um problema ao tentar fazer o login. Tente novamente.',
      });
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Senhas não conferem!' });
        return;
    }
    setIsLoading(true);
    try {
        await saveUser(registerUsername, registerPassword);
        toast({ title: 'Usuário registrado com sucesso!', description: 'Você já pode fazer login.'});
        // Alternar para a aba de login ou limpar campos
        setRegisterUsername('');
        setRegisterPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro ao registrar', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <p>Carregando...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm border-border shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <Logo onLoginPage={true} />
          <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Registrar</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                     <form onSubmit={handleLogin} className="space-y-4 pt-4">
                        <div className="space-y-2">
                        <Label htmlFor="login-user">Usuário</Label>
                        <Input
                            id="login-user"
                            type="text"
                            placeholder="Seu usuário"
                            required
                            value={loginUsername}
                            onChange={(e) => setLoginUsername(e.target.value)}
                            disabled={isLoading}
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <Input
                            id="login-password"
                            type="password"
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : 'Login'}
                        </Button>
                    </form>
                </TabsContent>
                <TabsContent value="register">
                     <form onSubmit={handleRegister} className="space-y-4 pt-4">
                        <div className="space-y-2">
                        <Label htmlFor="register-user">Novo Usuário</Label>
                        <Input
                            id="register-user"
                            type="text"
                            placeholder="Escolha um usuário"
                            required
                            value={registerUsername}
                            onChange={(e) => setRegisterUsername(e.target.value)}
                            disabled={isLoading}
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="register-password">Senha</Label>
                        <Input
                            id="register-password"
                            type="password"
                            required
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirme a Senha</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Registrando...' : 'Registrar'}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
         
        </CardContent>
      </Card>
    </div>
  );
}
