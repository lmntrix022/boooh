import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ImagePlus, Link, Palette, Settings, Share2 } from 'lucide-react'

const CardEditor = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme: 'purple',
    isPublic: true,
    allowBooking: true,
    allowShop: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name as keyof typeof formData] }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Éditeur de carte</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Aperçu
          </Button>
          <Button size="sm">
            Publier
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-4 gap-4 bg-transparent">
          <TabsTrigger value="general" className="data-[state=active]:bg-black data-[state=active]:text-blue-950">
            Général
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-black data-[state=active]:text-blue-950">
            Apparence
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-black data-[state=active]:text-blue-950">
            Social
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-black data-[state=active]:text-blue-950">
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label>Titre de la carte</Label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Jean Dupont - Consultant Marketing Digital"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre activité en quelques mots..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Photo de profil</Label>
                <div className="mt-2">
                  <Button variant="outline" className="w-full h-32 border-dashed">
                    <ImagePlus className="w-6 h-6 mr-2" />
                    Ajouter une photo
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label>Thème</Label>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  {['purple', 'blue', 'green', 'orange'].map(theme => (
                    <button
                      key={theme}
                      onClick={() => setFormData(prev => ({ ...prev, theme }))}
                      className={`w-full aspect-video rounded-lg bg-${theme}-500 hover:ring-2 hover:ring-offset-2 hover:ring-${theme}-500 transition-all ${
                        formData.theme === theme ? `ring-2 ring-offset-2 ring-${theme}-500` : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Style de carte</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {['Modern', 'Classic', 'Minimal'].map(style => (
                    <Card key={style} className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-gray-100 rounded mb-2" />
                      <p className="text-sm font-medium text-center">{style}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              {['LinkedIn', 'Twitter', 'Instagram', 'Website'].map(platform => (
                <div key={platform}>
                  <Label>{platform}</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1">
                      <Input
                        placeholder={`Votre lien ${platform}`}
                        className="w-full"
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Carte publique</Label>
                  <p className="text-sm text-gray-500">Rendre votre carte visible publiquement</p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={() => handleSwitchChange('isPublic')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Prise de rendez-vous</Label>
                  <p className="text-sm text-gray-500">Permettre aux visiteurs de prendre rendez-vous</p>
                </div>
                <Switch
                  checked={formData.allowBooking}
                  onCheckedChange={() => handleSwitchChange('allowBooking')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Boutique en ligne</Label>
                  <p className="text-sm text-gray-500">Activer la vente de produits/services</p>
                </div>
                <Switch
                  checked={formData.allowShop}
                  onCheckedChange={() => handleSwitchChange('allowShop')}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CardEditor 