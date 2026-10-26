export default {
  beforeCreate(event: any) {
    const { data } = event.params;
    if (data.title && data.title.length < 10) {
      throw new Error('Le titre de la discussion doit contenir au moins 10 caractères.');
    }
    if (!data.content) {
      throw new Error('Le contenu de la discussion est obligatoire.');
    }
  },
  beforeUpdate(event: any) {
    const { data } = event.params;
    if (data.title && data.title.length < 10) {
      throw new Error('Le titre de la discussion doit contenir au moins 10 caractères.');
    }
  },
};