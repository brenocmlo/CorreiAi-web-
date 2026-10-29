'use client';

import React, { useRef, useState, FormEvent } from 'react';
import type { ImovelInput } from '@/hooks/useImoveis';
import { parseImageMetadata } from '@/lib/imoveis-upload';
import { useRouter } from 'next/navigation';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type CampoImovel = 'endereco' | 'bairro' | 'valor' | 'metragem' | 'quartos' | 'vagas';
type ErrosImovel = Partial<Record<CampoImovel, string>>;

function validarImovel(dados: ImovelInput): ErrosImovel {
  const erros: ErrosImovel = {};
  if (!dados.endereco.trim()) erros.endereco = 'Informe o endereço.';
  if (!dados.bairro.trim()) erros.bairro = 'Informe o bairro.';
  if (!(dados.valor > 0)) erros.valor = 'Informe um valor maior que zero.';
  if (dados.metragem != null && dados.metragem < 0) erros.metragem = 'A metragem não pode ser negativa.';
  if (!Number.isInteger(dados.quartos ?? 0) || (dados.quartos ?? 0) < 0) erros.quartos = 'Use um número inteiro, zero ou maior.';
  if (!Number.isInteger(dados.vagas ?? 0) || (dados.vagas ?? 0) < 0) erros.vagas = 'Use um número inteiro, zero ou maior.';
  return erros;
}

interface ImovelFormProps {
  initialData?: ImovelInput & { imagem_url?: string | null };
  onSubmit: (data: ImovelInput) => Promise<boolean>;
  onUploadImage?: (file: File) => Promise<string | null>;
  isLoading: boolean;
  error?: string | null;
}

export default function ImovelForm({ initialData, onSubmit, onUploadImage, isLoading, error }: ImovelFormProps) {
  const router = useRouter();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erros, setErros] = useState<ErrosImovel>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  const busy = useRef(false);
  
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
    descricao: initialData?.descricao || null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumber = ['valor', 'metragem', 'quartos', 'vagas'].includes(name);

    setErros((prev) => ({ ...prev, [name]: undefined }));
    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy.current || isLoading || saved) return;
    setSubmitError('');

    const errosValidacao = validarImovel(formData);
    setErros(errosValidacao);
    if (Object.keys(errosValidacao).length > 0) {
      setSubmitError('Revise os campos indicados antes de salvar.');
      return;
    }
    busy.current = true;
    setSubmitting(true);
    try {
      let finalUrl = formData.imagem_url;
      if (imageFile) {
        const metadata = parseImageMetadata(imageFile);
        if (!metadata.extension) throw new Error(metadata.error);
        if (!onUploadImage) throw new Error('Não foi possível enviar a imagem. Tente novamente.');
        setUploading(true);
        const url = await onUploadImage(imageFile);
        setUploading(false);
        if (!url) throw new Error('Não foi possível enviar a imagem. O imóvel ainda não foi salvo. Verifique o arquivo e tente novamente.');
        finalUrl = url;
        setFormData(previous => ({ ...previous, imagem_url: url }));
        setImageFile(null);
        setImageUploaded(true);
      }
      const success = await onSubmit({ ...formData, imagem_url: finalUrl });
      if (!success) throw new Error('Não foi possível confirmar o cadastro. Confira a mensagem e tente novamente.');
      setSaved(true);
      router.push(`/imoveis?resultado=${initialData ? 'atualizado' : 'cadastrado'}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Não foi possível concluir. Verifique sua conexão e tente novamente.');
    } finally {
      busy.current = false;
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting || isLoading}
      className="space-y-6 bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700"
    >
      <div className="mb-6 border-b border-slate-700 pb-6">
        <label htmlFor="imagem-imovel" className="block text-sm font-medium text-slate-300 mb-2">
          Foto Principal do Imóvel
        </label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            id="imagem-imovel"
            accept="image/jpeg,image/png,image/webp"
            disabled={submitting || saved}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setImageFile(e.target.files[0]);
                setImageUploaded(false);
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
        <p className="mt-2 text-xs text-slate-400">JPEG, PNG ou WebP, até 5 MB.</p>
        {imageFile && <p className="mt-2 break-all text-sm text-slate-300">Selecionada: {imageFile.name}</p>}
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

        <Field label="Endereço Completo" htmlFor="endereco" required error={erros.endereco} className="md:col-span-2">
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

        <Field label="Descrição" htmlFor="descricao" className="md:col-span-2">
          <Textarea
            id="descricao"
            name="descricao"
            value={formData.descricao ?? ''}
            onChange={handleChange}
            rows={4}
            placeholder="Destaques do imóvel, acabamento, vizinhança..."
          />
        </Field>

        <Field label="Bairro" htmlFor="bairro" required error={erros.bairro}>
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

        <Field label="Valor (R$)" htmlFor="valor" required error={erros.valor}>
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

        <Field label="Metragem (m²)" htmlFor="metragem" error={erros.metragem}>
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
          <Field label="Quartos" htmlFor="quartos" error={erros.quartos}>
            <Input
              type="number"
              id="quartos"
              name="quartos"
              value={formData.quartos || ''}
              onChange={handleChange}
              min="0"
            />
          </Field>
          <Field label="Vagas" htmlFor="vagas" error={erros.vagas}>
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

      {(error || submitError) && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error || submitError}</p>}
      {(submitting || saved || imageUploaded) && <p role="status" className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
        {saved ? `Imóvel ${initialData ? 'atualizado' : 'cadastrado'} com sucesso! Abrindo a lista...` : uploading ? 'Enviando imagem. Aguarde...' : submitting ? `${imageUploaded ? 'Imagem enviada com sucesso. ' : ''}Salvando imóvel...` : 'Imagem enviada com sucesso.'}
      </p>}
      <div className="pt-6 border-t border-slate-700 flex flex-wrap justify-end gap-4">
        <Button type="button" variant="secondary" disabled={submitting || saved} onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saved} isLoading={isLoading || submitting} className="min-w-[140px]">
          {saved ? 'Salvo!' : uploading ? 'Enviando imagem...' : submitting || isLoading ? 'Salvando...' : 'Salvar Imóvel'}
        </Button>
      </div>
    </form>
  );
}
