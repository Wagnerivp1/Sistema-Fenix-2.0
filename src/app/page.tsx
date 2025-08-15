
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { getUsers, saveUsers, saveSessionToken, getSessionToken } from '@/lib/storage';
import type { User, UserPermissions } from '@/types';

const defaultPermissions: UserPermissions = {
  accessDashboard: true,
  accessClients: true,
  accessServiceOrders: true,
  accessInventory: true,
  accessSales: true,
  accessFinancials: false,
  accessSettings: false,
  accessDangerZone: false,
  accessAgenda: true,
  accessQuotes: true,
  canEdit: true,
  canDelete: false,
  canViewPasswords: false,
  canManageUsers: false,
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ name: '', login: '', password: '' });

  React.useEffect(() => {
    // This function ensures the default user list is in localStorage on first load.
    getUsers(); 
    
    // The AuthGuard in the main layout will handle redirects if a token exists.
    // This page should always be accessible to non-logged-in users.
    setIsLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const users = await getUsers();
      const user = users.find(u => u.login === login);
      
      const inputPasswordEncoded = btoa(password);

      if (user && (user.password === password || user.password === inputPasswordEncoded)) {
        saveSessionToken(`TOKEN-${Date.now()}-${Math.random()}`, user);
        toast({
          title: 'Login bem-sucedido!',
          description: `Bem-vindo, ${user.name}! Redirecionando...`,
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
    if (!newUser.name || !newUser.login || !newUser.password) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Por favor, preencha todos os campos.' });
      return;
    }
    
    const users = await getUsers();
    if (users.some(u => u.login === newUser.login)) {
      toast({ variant: 'destructive', title: 'Usuário já existe', description: 'Este login já está em uso. Por favor, escolha outro.' });
      return;
    }

    const userToSave: User = {
      id: `USER-${Date.now()}`,
      name: newUser.name,
      login: newUser.login,
      password: btoa(newUser.password), // Encrypt password
      permissions: defaultPermissions,
      theme: 'dark'
    };
    
    await saveUsers([...users, userToSave]);
    toast({ title: 'Usuário registrado com sucesso!', description: 'Agora você pode fazer login com suas novas credenciais.'});
    setIsRegisterOpen(false);
    setNewUser({ name: '', login: '', password: '' });
  };
  
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
           <form onSubmit={handleLogin} className="space-y-4 pt-4">
              <div className="space-y-2">
              <Label htmlFor="login-user">Usuário</Label>
              <Input
                  id="login-user"
                  type="text"
                  placeholder="Seu usuário de login"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  disabled={isLoading}
              />
              </div>
              <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                  id="login-password"
                  type="password"
                  placeholder="Sua senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
              />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Login'}
              </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DialogTrigger asChild>
                    <Button variant="link" className="w-full">
                        Registrar novo usuário
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Novo Usuário</DialogTitle>
                        <DialogDescription>
                            Crie uma nova conta para acessar o sistema. As permissões serão limitadas por padrão.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegister}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="reg-name">Nome Completo</Label>
                                <Input id="reg-name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-login">Usuário de Acesso</Label>
                                <Input id="reg-login" value={newUser.login} onChange={(e) => setNewUser({...newUser, login: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-password">Senha</Label>
                                <Input id="reg-password" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                            </div>
                        </div>
                         <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsRegisterOpen(false)}>Cancelar</Button>
                            <Button type="submit">Registrar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
