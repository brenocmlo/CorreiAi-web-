'use client';

import React, { useState, FormEvent } from 'react';
import { ImovelInput } from '@/hooks/useImoveis';
import { useRouter } from 'next/navigation';
import { Field, Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ImovelFormProps {
  initialData?: ImovelInput & { imagem_url?: string | null };
  onSubmit: (data: ImovelInput) => Promise<boolean>;
  onUploadImage?: (file: File) => Promise<string | null>;
  isLoading: boolean;
}

export default function ImovelForm({ initialData, onSubmit, onUploadImage, isLoading }: ImovelFormProps) {
  const router = useRouter();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<ImovelInput>({
    tipo: initialData?.tipo || 'casa',
    endereco: initialData?.endereco || '',
    bairro: initialData?.bairro || '',
    valor: initialData?.valor || 0,
    metragem: initialData?.metragem || 0,
    quartos: initialData?.quartos || 0,
    vagas: initialData?.vagas || 0,
    status: initialData?.status || 'disponivel',
    imagem_url: initialData?.imagem_url || null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = ['valor', 'metragem', 'quartos', 'vagas'].includes(name);
    
    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let finalUrl = formData.imagem_url;
    
    if (imageFile && onUploadImage) {
      setUploading(true);
      const url = await onUploadImage(imageFile);
      setUploading(false);
      if (url) {
        finalUrl = url;
      } else {
        // Falha no upload, mas continua para tentar salvar o form
        alert('Erro ao fazer upload da imagem. O imóvel será salvo sem a nova imagem.');
      }
    }

    const success = await onSubmit({ ...formData, imagem_url: finalUrl });
    if (success) {
      router.push('/imoveis');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700"
    >
      <div className="mb-6 border-b border-slate-700 pb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Foto Principal do Imóvel
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setImageFile(e.target.files[0]);
              }
            }}
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2.5 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-slate-700 file:text-slate-300
              hover:file:bg-slate-600 transition-colors"
          />
          {formData.imagem_url && !imageFile && (
            <div className="text-sm text-slate-400 truncate w-32">
              (Imagem atual salva)
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Tipo de Imóvel" htmlFor="tipo" required>
          <Select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="terreno">Terreno</option>
            <option value="comercial">Ponto Comercial</option>
          </Select>
        </Field>

        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" value={formData.status} onChange={handleChange} required>
            <option value="disponivel">Disponível</option>
            <option value="vendido">Vendido</option>
            <option value="alugado">Alugado</option>
          </Select>
        </Field>

        <Field label="Endereço Completo" htmlFor="endereco" required className="md:col-span-2">
          <Input
            type="text"
            id="endereco"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            required
            placeholder="Ex: Rua das Flores, 123"
          />
        </Field>

        <Field label="Bairro" htmlFor="bairro" required>
          <Input
            type="text"
            id="bairro"
            name="bairro"
            value={formData.bairro}
            onChange={handleChange}
            required
            placeholder="Ex: Centro"
          />
        </Field>

        <Field label="Valor (R$)" htmlFor="valor" required>
          <Input
            type="number"
            id="valor"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </Field>

        <Field label="Metragem (m²)" htmlFor="metragem">
          <Input
            type="number"
            id="metragem"
            name="metragem"
            value={formData.metragem || ''}
            onChange={handleChange}
            min="0"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quartos" htmlFor="quartos">
            <Input
              type="number"
              id="quartos"
              name="quartos"
              value={formData.quartos || ''}
              onChange={handleChange}
              min="0"
            />
          </Field>
          <Field label="Vagas" htmlFor="vagas">
            <Input
              type="number"
              id="vagas"
              name="vagas"
              value={formData.vagas || ''}
              onChange={handleChange}
              min="0"
            />
          </Field>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-700 flex justify-end gap-4">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading || uploading} className="min-w-[140px]">
          {uploading ? 'Enviando imagem...' : isLoading ? 'Salvando...' : 'Salvar Imóvel'}
        </Button>
      </div>
    </form>
  );
}
