'use client';

import React, { useState, FormEvent } from 'react';
import { ImovelInput } from '@/hooks/useImoveis';
import { useRouter } from 'next/navigation';

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
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700">
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
        
        {/* Tipo */}
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-slate-300 mb-2">
            Tipo de Imóvel *
          </label>
          <select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="terreno">Terreno</option>
            <option value="comercial">Ponto Comercial</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
            Status *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="disponivel">Disponível</option>
            <option value="vendido">Vendido</option>
            <option value="alugado">Alugado</option>
          </select>
        </div>

        {/* Endereço */}
        <div className="md:col-span-2">
          <label htmlFor="endereco" className="block text-sm font-medium text-slate-300 mb-2">
            Endereço Completo *
          </label>
          <input
            type="text"
            id="endereco"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            required
            placeholder="Ex: Rua das Flores, 123"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bairro */}
        <div>
          <label htmlFor="bairro" className="block text-sm font-medium text-slate-300 mb-2">
            Bairro *
          </label>
          <input
            type="text"
            id="bairro"
            name="bairro"
            value={formData.bairro}
            onChange={handleChange}
            required
            placeholder="Ex: Centro"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Valor */}
        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-slate-300 mb-2">
            Valor (R$) *
          </label>
          <input
            type="number"
            id="valor"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Metragem */}
        <div>
          <label htmlFor="metragem" className="block text-sm font-medium text-slate-300 mb-2">
            Metragem (m²)
          </label>
          <input
            type="number"
            id="metragem"
            name="metragem"
            value={formData.metragem || ''}
            onChange={handleChange}
            min="0"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Quartos e Vagas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="quartos" className="block text-sm font-medium text-slate-300 mb-2">
              Quartos
            </label>
            <input
              type="number"
              id="quartos"
              name="quartos"
              value={formData.quartos || ''}
              onChange={handleChange}
              min="0"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="vagas" className="block text-sm font-medium text-slate-300 mb-2">
              Vagas
            </label>
            <input
              type="number"
              id="vagas"
              name="vagas"
              value={formData.vagas || ''}
              onChange={handleChange}
              min="0"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-700 flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || uploading}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
        >
          {uploading ? 'Enviando imagem...' : isLoading ? 'Salvando...' : 'Salvar Imóvel'}
        </button>
      </div>
    </form>
  );
}
