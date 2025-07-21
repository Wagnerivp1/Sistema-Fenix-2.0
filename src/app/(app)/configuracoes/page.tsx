
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Save, Download, Upload, AlertTriangle, Trash2, PlusCircle, Users, KeyRound, Phone, User as UserIcon, Building, Image as ImageIcon, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
import { Switch } from '@/components/ui/switch';
import { getUsers, saveUsers, getLoggedInUser, getCompanyInfo, saveCompanyInfo } from '@/lib/storage';
import type { User, CompanyInfo } from '@/types';
import Image from 'next/image';

const SETTINGS_KEY = 'app_settings';
const MASTER_USER_ID = 'master-0';

interface AppSettings {
  defaultWarrantyDays: number;
}

const initialNewUser: Partial<User> = {
  name: '',
  username: '',
  password: '',
  phone: '',
  role: 'normal',
  active: true,
};

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<AppSettings>({
    defaultWarrantyDays: 90,
  });
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo>({
      name: '', address: '', phone: '', emailOrSite: '', document: '', logoUrl: ''
  });
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isClearAlertOpen, setIsClearAlertOpen] = React.useState(false);
  const [isRestoreAlertOpen, setIsRestoreAlertOpen] = React.useState(false);
  const [backupFile, setBackupFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  const [isUserDialogOpen, setIsUserDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [newUser, setNewUser] = React.useState<Partial<User>>(initialNewUser);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
        
        const [companyInfoData, usersData, loggedInUser] = await Promise.all([
            getCompanyInfo(),
            getUsers(),
            getLoggedInUser()
        ]);
        
        setCompanyInfo(companyInfoData || { name: '', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '' });
        setUsers(usersData.filter(u => u.id !== MASTER_USER_ID));
        setCurrentUser(loggedInUser);
      } catch (error) {
        console.error("Failed to load settings", error);
        toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: 'Não foi possível buscar as informações do servidor.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);
  
  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewUser(prev => ({ ...prev, [id]: value }));
  };
  
  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSaveCompanyInfo = async () => {
    await saveCompanyInfo(companyInfo);
    toast({
        title: "Dados da Empresa Salvos!",
        description: "As informações da sua empresa foram atualizadas.",
    });
  };
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: 'Por favor, selecione uma imagem com menos de 1MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyInfo(prev => ({...prev, logoUrl: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setCompanyInfo(prev => ({...prev, logoUrl: ''}));
    if(logoInputRef.current) {
        logoInputRef.current.value = '';
    }
  };


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

  const handleBackup = async () => {
    try {
      const backupData: Record<string, any> = {};
      const dataTypes = ['customers', 'serviceOrders', 'stock', 'sales', 'financialTransactions', 'users', 'companyInfo'];
      
      for (const type of dataTypes) {
        const response = await fetch(`/api/data/${type}`);
        if(response.ok) {
            backupData[type] = await response.json();
        }
      }
      
      const settingsData = localStorage.getItem(SETTINGS_KEY);
      if(settingsData) {
        backupData.settings = JSON.parse(settingsData);
      }

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
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Could not read file content.');
        }
        const data = JSON.parse(text);

        const dataTypes = ['customers', 'serviceOrders', 'stock', 'sales', 'financialTransactions', 'users', 'companyInfo'];
        const hasKnownKey = dataTypes.some(key => key in data);

        if (!hasKnownKey) {
          throw new Error('Arquivo de backup inválido ou corrompido.');
        }

        for (const type in data) {
            if(dataTypes.includes(type)) {
                 await fetch(`/api/data/${type}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data[type]),
                });
            } else if (type === 'settings') {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
            }
        }
        
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

  const handleClearSystem = async () => {
    try {
      const dataTypes = ['customers', 'serviceOrders', 'stock', 'sales', 'financialTransactions', 'users', 'companyInfo'];
      for (const type of dataTypes) {
         await fetch(`/api/data/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(type === 'companyInfo' ? {} : []),
        });
      }
      localStorage.removeItem(SETTINGS_KEY);
      
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
      setNewUser({ ...initialNewUser, role: 'normal', active: true });
    }
    setIsUserDialogOpen(true);
  }

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.username || (!newUser.password && !editingUser)) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Nome, Login e Senha são obrigatórios.' });
      return;
    }

    let updatedUsers: User[];
    if (editingUser) {
      // Logic for editing an existing user
      const userToUpdate: User = { ...editingUser, ...newUser };
      if (newUser.password === '') {
        delete userToUpdate.password;
      }
      updatedUsers = users.map(u => u.id === editingUser.id ? userToUpdate : u);
      toast({ title: 'Usuário Atualizado!', description: `Os dados de ${newUser.name} foram salvos.` });
    } else {
      // Logic for adding a new user
      const userToAdd: User = {
        id: `USER-${Date.now()}`,
        name: newUser.name!,
        username: newUser.username!,
        password: newUser.password!,
        phone: newUser.phone || '',
        role: newUser.role! as User['role'],
        active: newUser.active ?? true,
      };
      updatedUsers = [...users, userToAdd];
      toast({ title: 'Usuário Adicionado!', description: `${newUser.name} foi adicionado ao sistema.` });
    }

    setUsers(updatedUsers);
    await saveUsers(updatedUsers);
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };
  
  const handleToggleActive = async (userId: string) => {
    const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, active: !u.active } : u
      );
    setUsers(updatedUsers);
    await saveUsers(updatedUsers);
    const user = updatedUsers.find(u => u.id === userId);
    toast({
        title: `Status Alterado!`,
        description: `Usuário ${user?.name} foi ${user?.active ? 'ativado' : 'desativado'}.`
    });
  }

  const handleDeleteUser = async (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    await saveUsers(updatedUsers);
    toast({
      title: 'Usuário Excluído!',
      description: 'O usuário foi removido permanentemente do sistema.',
      variant: 'destructive'
    });
  };

  const getRoleInPortuguese = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'technician':
        return 'Técnico';
      case 'sales':
        return 'Vendedor';
      case 'normal':
        return 'Normal';
      case 'receptionist':
        return 'Recepcionista';
      default:
        return role;
    }
  };
  
  const isCurrentUserAdmin = currentUser?.role === 'admin';


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
            <CardTitle>Dados da Empresa</CardTitle>
            <CardDescription>
                Informações que aparecerão nos documentos e no sistema.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input id="name" value={companyInfo.name} onChange={handleCompanyInfoChange} disabled={!isCurrentUserAdmin} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="document">CNPJ / CPF</Label>
                    <Input id="document" value={companyInfo.document} onChange={handleCompanyInfoChange} disabled={!isCurrentUserAdmin} />
                </div>
            </div>
             <div className="space-y-1">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" value={companyInfo.address} onChange={handleCompanyInfoChange} disabled={!isCurrentUserAdmin} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="phone">Telefone de Contato</Label>
                    <Input id="phone" value={companyInfo.phone} onChange={handleCompanyInfoChange} disabled={!isCurrentUserAdmin} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="emailOrSite">E-mail ou Website</Label>
                    <Input id="emailOrSite" value={companyInfo.emailOrSite} onChange={handleCompanyInfoChange} disabled={!isCurrentUserAdmin} />
                </div>
            </div>
             <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-md border flex items-center justify-center bg-muted/30 overflow-hidden">
                    {companyInfo.logoUrl ? (
                      <Image src={companyInfo.logoUrl} alt="Logo Preview" width={80} height={80} className="object-contain" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                     <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={!isCurrentUserAdmin}>
                        Escolher Arquivo
                    </Button>
                    <input 
                      ref={logoInputRef}
                      type="file"
                      className="hidden"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleLogoUpload}
                    />
                     {companyInfo.logoUrl && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveLogo} disabled={!isCurrentUserAdmin}>
                            <X className="w-4 h-4 mr-1" />
                            Remover Logo
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG, até 1MB.</p>
                  </div>
                </div>
            </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSaveCompanyInfo} disabled={!isCurrentUserAdmin}>
                <Building className="mr-2 h-4 w-4" />
                Salvar Dados da Empresa
            </Button>
        </CardFooter>
    </Card>
    
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
                disabled={!isCurrentUserAdmin}
             />
             <p className="text-sm text-muted-foreground">
                Este valor será usado como padrão para os serviços que não tiverem uma garantia específica.
             </p>
           </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSaveSettings} disabled={!isCurrentUserAdmin}>
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
        <Button size="sm" onClick={() => handleOpenUserDialog(null)} disabled={!isCurrentUserAdmin}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="text-center">Ativar/Desativar</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? users.map(user => (
              <TableRow key={user.id} className={!user.active ? 'bg-muted/30' : ''}>
                <TableCell>
                  <Badge variant={user.active ? 'default' : 'secondary'} className="w-16 justify-center">
                    {user.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{getRoleInPortuguese(user.role)}</TableCell>
                <TableCell className="text-center">
                   <Switch
                    checked={user.active}
                    onCheckedChange={() => handleToggleActive(user.id)}
                    aria-label="Ativar ou desativar usuário"
                    disabled={!isCurrentUserAdmin || user.id === currentUser?.id}
                  />
                </TableCell>
                <TableCell className="text-right space-x-2">
                   <Button variant="outline" size="sm" onClick={() => handleOpenUserDialog(user)} disabled={!isCurrentUserAdmin}>
                     Editar
                   </Button>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={!isCurrentUserAdmin || user.id === currentUser?.id}>Excluir</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário {user.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Nenhum usuário cadastrado.</TableCell>
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
                        As ações abaixo são irreversíveis e só podem ser executadas por administradores.
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
                    <Button variant="outline" onClick={handleBackup} disabled={!isCurrentUserAdmin}>
                        <Download className="mr-2 h-4 w-4"/>
                        Fazer Backup
                    </Button>
                     <Button variant="outline" onClick={handleRestoreClick} disabled={!isCurrentUserAdmin}>
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
                    <Button variant="destructive" onClick={() => setIsClearAlertOpen(true)} disabled={!isCurrentUserAdmin}>
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para gerenciar a conta de usuário.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" placeholder="John Doe" value={newUser.name || ''} onChange={handleUserInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(99) 99999-9999" value={newUser.phone || ''} onChange={handleUserInputChange} />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Login de Acesso</Label>
              <Input id="username" placeholder="joao.silva" value={newUser.username || ''} onChange={handleUserInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder={editingUser ? 'Deixe em branco para não alterar' : 'Senha forte'} onChange={handleUserInputChange} />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="role">Cargo / Função</Label>
            <Select value={newUser.role || 'normal'} onValueChange={(value) => setNewUser(p => ({...p, role: value as User['role']}))}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
                <SelectItem value="technician">Técnico</SelectItem>
                <SelectItem value="sales">Vendedor</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
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
