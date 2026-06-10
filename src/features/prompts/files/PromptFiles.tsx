import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import {
  deletePromptFile,
  getPromptFiles,
  openPromptFile,
  uploadPromptFile
} from "./file-api";

export function PromptFiles({ promptId }: { promptId: string }) {
  const queryClient = useQueryClient();
  const key = ["prompt-files", promptId];
  const files = useQuery({ queryFn: () => getPromptFiles(promptId), queryKey: key });
  const upload = useMutation({
    mutationFn: (file: File) => uploadPromptFile(promptId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });
  const remove = useMutation({
    mutationFn: ({ id, path }: { id: string; path: string }) =>
      deletePromptFile(id, path),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });

  return (
    <section className="editor-card prompt-files">
      <h2><Paperclip size={18} /> Knowledge files</h2>
      <label className="file-upload">
        <Upload size={16} /> Add file
        <input
          accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload.mutate(file);
            event.target.value = "";
          }}
          type="file"
        />
      </label>
      {upload.isError ? <p className="form-error">{upload.error.message}</p> : null}
      <ul className="file-list">
        {files.data?.map((file) => (
          <li key={file.id}>
            <span>{file.file_name}</span>
            <button aria-label={`Download ${file.file_name}`} onClick={() => openPromptFile(file.storage_path)} type="button"><Download size={15} /></button>
            <button aria-label={`Delete ${file.file_name}`} onClick={() => remove.mutate({ id: file.id, path: file.storage_path })} type="button"><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
      {!files.data?.length ? <p className="muted-copy">Attach research, documents, or reference images.</p> : null}
    </section>
  );
}
