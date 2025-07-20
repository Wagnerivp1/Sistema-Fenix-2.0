
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Save, Download, Upload, AlertTriangle, Trash2, PlusCircle, MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { APP_STORAGE_KEYS, getUsers, saveUsers } from '@/lib/storage';
import type { User } from '@/types';

const SETTINGS_KEY = 'app_settings';

interface AppSettings {
  defaultWarrantyDays: number;
}

const initialNewUser: Omit<User, 'id'> = {
  username: '',
  password: '',
  role: 'technician',
  active: true,
};

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<AppSettings>({
    defaultWarrantyDays: 90,
  });
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isClearAlertOpen, setIsClearAlertOpen] = React.useState(false);
  const [isRestoreAlertOpen, setIsRestoreAlertOpen] = React.useState(false);
  const [backupFile, setBackupFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [newUser, setNewUser] = React.useState<Partial<User>>(initialNewUser);

  React.useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      setUsers(getUsers());
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      toast({
        title: "Configurações Salvas!",
        description: "Suas alterações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações.",
      });
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: Number(value) }));
  };

  const handleBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      APP_STORAGE_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          // Special handling for settings object vs arrays
          if (key === SETTINGS_KEY) {
            backupData[key] = JSON.parse(data);
          } else {
            backupData[key] = JSON.parse(data);
          }
        }
      });

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup-assistec-now-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Backup Realizado!', description: 'O download do arquivo de backup foi iniciado.' });
    } catch (error) {
      console.error("Backup error:", error);
      toast({ variant: 'destructive', title: 'Erro no Backup', description: 'Não foi possível gerar o arquivo de backup.' });
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setBackupFile(file);
      setIsRestoreAlertOpen(true);
    } else {
      toast({ variant: 'destructive', title: 'Arquivo Inválido', description: 'Por favor, selecione um arquivo de backup JSON válido.' });
    }
    if(event.target) {
      event.target.value = '';
    }
  };

  const confirmRestore = () => {
    if (!backupFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Could not read file content.');
        }
        const data = JSON.parse(text);

        const hasKnownKey = APP_STORAGE_KEYS.some(key => key in data);
        if (!hasKnownKey) {
          throw new Error('Arquivo de backup inválido ou corrompido.');
        }

        APP_STORAGE_KEYS.forEach(key => {
          localStorage.removeItem(key);
        });

        Object.keys(data).forEach(key => {
           if (APP_STORAGE_KEYS.includes(key)) {
              localStorage.setItem(key, JSON.stringify(data[key]));
           }
        });

        toast({ title: 'Restauração Concluída!', description: 'Os dados foram restaurados com sucesso. A página será recarregada.' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro na Restauração', description: error.message || 'Ocorreu um erro ao processar o arquivo de backup.' });
      } finally {
        setBackupFile(null);
        setIsRestoreAlertOpen(false);
      }
    };
    reader.readAsText(backupFile);
  };

  const handleClearSystem = () => {
    try {
      APP_STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      
      toast({ title: 'Sistema Limpo!', description: 'Todos os dados foram removidos. A página será recarregada.' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível limpar os dados do sistema.' });
    }
    setIsClearAlertOpen(false);
  };

  const handleOpenUserDialog = (user: User | null) => {
    setEditingUser(user);
    if (user) {
      setNewUser(user);
    } else {
      setNewUser(initialNewUser);
    }
    setIsUserDialogOpen(true);
  }

  const handleSaveUser = () => {
    if (!newUser.username || (!newUser.password && !editingUser)) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Nome de usuário e senha são obrigatórios.' });
      return;
    }

    let updatedUsers: User[];
    if (editingUser) {
      // Edit existing user
      updatedUsers = users.map(u => 
        u.id === editingUser.id 
          ? { ...editingUser, ...newUser } 
          : u
      );
      toast({ title: 'Usuário Atualizado!', description: `Os dados de ${newUser.username} foram salvos.` });
    } else {
      // Add new user
      const userToAdd: User = {
        id: `USER-${Date.now()}`,
        username: newUser.username!,
        password: newUser.password!,
        role: newUser.role! as User['role'],
        active: newUser.active ?? true,
      };
      updatedUsers = [...users, userToAdd];
      toast({ title: 'Usuário Adicionado!', description: `${newUser.username} foi adicionado ao sistema.` });
    }

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setNewUser(initialNewUser);
  };


  if (isLoading) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>
            Ajuste as configurações gerais do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Configurações Gerais</CardTitle>
        <CardDescription>
          Ajuste as configurações gerais do sistema. As alterações são salvas localmente no seu navegador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg">
           <h3 className="text-lg font-semibold mb-2">Garantia</h3>
           <div className="space-y-2">
             <Label htmlFor="defaultWarrantyDays">Prazo de Garantia Padrão (em dias)</Label>
             <Input 
                id="defaultWarrantyDays" 
                type="number" 
                className="max-w-xs" 
                value={settings.defaultWarrantyDays}
                onChange={handleSettingsChange}
             />
             <p className="text-sm text-muted-foreground">
                Este valor será usado como padrão para os serviços que não tiverem uma garantia específica.
             </p>
           </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSaveSettings}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
        </Button>
      </CardFooter>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Adicione, edite ou desative contas de usuário.</CardDescription>
        </div>
        <Button size="sm" onClick={() => handleOpenUserDialog(null)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome de Usuário</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>
                  <Badge variant={user.active ? 'default' : 'secondary'}>{user.active ? 'Ativo' : 'Inativo'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Menu de Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => handleOpenUserDialog(user)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Desativar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Nenhum usuário cadastrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>

    <Card className="border-destructive">
        <CardHeader>
             <div className="flex items-start gap-4">
                <div className="p-2 bg-destructive/10 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription className="text-destructive/80">
                        As ações abaixo são irreversíveis. Tenha certeza do que está fazendo.
                    </CardDescription>
                </div>
             </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h4 className="font-semibold">Backup e Restauração</h4>
                    <p className="text-sm text-muted-foreground">
                        Salve uma cópia de segurança de todos os seus dados ou restaure a partir de um arquivo.
                    </p>
                </div>
                 <div className="flex-shrink-0 flex items-center gap-2">
                    <Button variant="outline" onClick={handleBackup}>
                        <Download className="mr-2 h-4 w-4"/>
                        Fazer Backup
                    </Button>
                     <Button variant="outline" onClick={handleRestoreClick}>
                        <Upload className="mr-2 h-4 w-4"/>
                        Restaurar
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        className="hidden"
                        accept=".json"
                    />
                </div>
            </div>
             <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h4 className="font-semibold">Limpar Sistema</h4>
                    <p className="text-sm text-muted-foreground">
                        Exclui permanentemente todos os clientes, OS, estoque, vendas e finanças.
                    </p>
                </div>
                 <div className="flex-shrink-0">
                    <Button variant="destructive" onClick={() => setIsClearAlertOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpar Todos os Dados
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>

    <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação é irreversível e excluirá permanentemente TODOS os dados do sistema, incluindo clientes, ordens de serviço, estoque e registros financeiros. Não há como desfazer.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={handleClearSystem}
            >
                Sim, excluir tudo
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={isRestoreAlertOpen} onOpenChange={setIsRestoreAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
            <AlertDialogDescription>
                Tem certeza que deseja restaurar os dados do arquivo <span className="font-bold">{backupFile?.name}</span>? Esta ação substituirá TODOS os dados atuais do sistema. Faça um backup antes, se necessário.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupFile(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
                Sim, restaurar dados
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para gerenciar a conta de usuário.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input id="username" value={newUser.username || ''} onChange={(e) => setNewUser(p => ({...p, username: e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder={editingUser ? 'Deixe em branco para não alterar' : 'Senha de acesso'} onChange={(e) => setNewUser(p => ({...p, password: e.target.value}))} />
          </div>
           <div className="space-y-2">
            <Label htmlFor="role">Cargo / Função</Label>
            <Select value={newUser.role || 'technician'} onValueChange={(value) => setNewUser(p => ({...p, role: value as User['role']}))}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="technician">Técnico</SelectItem>
                <SelectItem value="sales">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsUserDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveUser}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </div>
  )
}
