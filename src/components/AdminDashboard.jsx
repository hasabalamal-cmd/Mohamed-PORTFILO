import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit,
  Images,
  FolderTree,
  Camera,
  Upload,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  Database,
  Cloud,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectImages,
  addProjectImage,
  deleteProjectImage,
  updateImageOrder,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  uploadImageToGoogleDrive,
  isSupabaseConfigured,
} from '../lib/supabaseClient';

export default function AdminDashboard({ onClose, onDataChanged, onLogout, t, lang }) {
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Data states
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  // Active Project for Image Management
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectImages, setProjectImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Forms states
  const [projectForm, setProjectForm] = useState({
    id: null,
    name: '',
    category_id: '',
    cover_image: '',
  });
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ id: null, name: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [equipmentForm, setEquipmentForm] = useState({
    id: null,
    name: '',
    model: '',
    image_url: '',
  });
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  // Load all data
  const loadAll = async () => {
    setLoading(true);
    try {
      const [cats, projs, equips] = await Promise.all([
        getCategories(),
        getProjects(),
        getEquipment(),
      ]);
      setCategories(cats || []);
      setProjects(projs || []);
      setEquipmentList(equips || []);

      if (activeProjectId) {
        const imgs = await getProjectImages(activeProjectId);
        setProjectImages(imgs || []);
      } else if (projs && projs.length > 0) {
        setActiveProjectId(projs[0].id);
        const imgs = await getProjectImages(projs[0].id);
        setProjectImages(imgs || []);
      }
    } catch (err) {
      console.error(err);
      showNotice('error', err.message || (lang === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      getProjectImages(activeProjectId).then((imgs) => setProjectImages(imgs || []));
    }
  }, [activeProjectId]);

  const showNotice = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // --------------------------------------------------------------------------
  // PROJECTS HANDLERS
  // --------------------------------------------------------------------------
  const handleOpenNewProject = () => {
    setProjectForm({
      id: null,
      name: '',
      category_id: categories[0]?.id || '',
      cover_image: '',
    });
    setShowProjectModal(true);
  };

  const handleEditProject = (proj) => {
    setProjectForm({
      id: proj.id,
      name: proj.name,
      category_id: proj.category_id,
      cover_image: proj.cover_image || '',
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) {
      showNotice('error', lang === 'ar' ? 'يرجى إدخال اسم المشروع' : 'Project name is required');
      return;
    }
    if (!projectForm.category_id) {
      showNotice('error', lang === 'ar' ? 'يرجى اختيار التصنيف' : 'Please select category');
      return;
    }

    setLoading(true);
    try {
      if (projectForm.id) {
        await updateProject(projectForm.id, projectForm);
        showNotice('success', lang === 'ar' ? 'تم تحديث المشروع بنجاح' : 'Project updated successfully');
        setShowProjectModal(false);
        await loadAll();
        if (onDataChanged) onDataChanged();
      } else {
        const created = await createProject(projectForm);
        showNotice('success', lang === 'ar' ? 'تم إنشاء المشروع بنجاح! تم نقلك لإدارة صوره' : 'Project created! Redirected to manage photos');
        setShowProjectModal(false);
        await loadAll();
        if (onDataChanged) onDataChanged();

        setActiveProjectId(created.id);
        setActiveTab('images');
      }
    } catch (err) {
      showNotice('error', err.message || (lang === 'ar' ? 'فشل حفظ المشروع' : 'Failed to save project'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id, name) => {
    const confirmPrompt = lang === 'ar' 
      ? `هل أنت متأكد من حذف المشروع "${name}" وجميع صوره؟`
      : `Are you sure you want to delete project "${name}" and all its photos?`;
    if (!window.confirm(confirmPrompt)) {
      return;
    }
    setLoading(true);
    try {
      await deleteProject(id);
      showNotice('success', lang === 'ar' ? 'تم حذف المشروع وصوره بنجاح' : 'Project deleted successfully');
      await loadAll();
      if (activeProjectId === id) {
        setActiveProjectId(projects.find((p) => p.id !== id)?.id || null);
      }
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showNotice('error', err.message || (lang === 'ar' ? 'فشل حذف المشروع' : 'Failed to delete project'));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // PROJECT IMAGES HANDLERS
  // --------------------------------------------------------------------------
  const handleUploadProjectImage = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProjectId) return;

    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadImageToGoogleDrive(file);
        const nextOrder = projectImages.length + i;
        await addProjectImage({
          project_id: activeProjectId,
          image_url: res.imageUrl,
          sort_order: nextOrder,
        });
      }
      showNotice('success', lang === 'ar' ? 'تم رفع وإضافة الصور بنجاح' : 'Photos uploaded successfully');
      const updatedImgs = await getProjectImages(activeProjectId);
      setProjectImages(updatedImgs);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showNotice('error', err.message || (lang === 'ar' ? 'فشل رفع الصور' : 'Failed to upload images'));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imgId) => {
    const confirmPrompt = lang === 'ar' ? 'هل تريد حذف هذه الصورة من المعرض؟' : 'Delete this photo from gallery?';
    if (!window.confirm(confirmPrompt)) return;
    try {
      await deleteProjectImage(imgId);
      const updated = await getProjectImages(activeProjectId);
      setProjectImages(updated);
      showNotice('success', lang === 'ar' ? 'تم حذف الصورة' : 'Photo deleted');
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showNotice('error', err.message || (lang === 'ar' ? 'فشل حذف الصورة' : 'Failed to delete photo'));
    }
  };

  const handleMoveImage = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projectImages.length) return;

    const currentImg = projectImages[index];
    const targetImg = projectImages[targetIndex];

    try {
      await updateImageOrder(currentImg.id, targetIndex);
      await updateImageOrder(targetImg.id, index);

      const updated = await getProjectImages(activeProjectId);
      setProjectImages(updated);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showNotice('error', lang === 'ar' ? 'فشل تغيير الترتيب' : 'Failed to reorder');
    }
  };

  // --------------------------------------------------------------------------
  // CATEGORIES HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showNotice('error', lang === 'ar' ? 'يرجى إدخال اسم التصنيف' : 'Category name is required');
      return;
    }
    setLoading(true);
    try {
      if (categoryForm.id) {
        await updateCategory(categoryForm.id, categoryForm.name);
        showNotice('success', lang === 'ar' ? 'تم تعديل التصنيف' : 'Category updated');
      } else {
        await createCategory(categoryForm.name);
        showNotice('success', lang === 'ar' ? 'تمت إضافة التصنيف' : 'Category added');
      }
      setShowCategoryModal(false);
      await loadAll();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showNotice('error', err.message || (lang === 'ar' ? 'فشل حفظ التصنيف' : 'Failed to save category'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const confirmPrompt = lang === 'ar' ? `هل أنت متأكد من حذف التصنيف "${cat.name}"؟` : `Are you sure you want to delete "${cat.name}"?`;
    if (!window.confirm(confirmPrompt)) return;

    setLoading(true);
    try {
      await deleteCategory(cat.id);
      showNotice('success', lang === 'ar' ? 'تم حذف التصنيف بنجاح' : 'Category deleted successfully');
      await loadAll();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showNotice('error', err.message || t('cannot_delete_cat_err'));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // EQUIPMENT HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveEquipment = async (e) => {
    e.preventDefault();
    if (!equipmentForm.name.trim()) {
      showNotice('error', lang === 'ar' ? 'يرجى إدخال اسم المعدة' : 'Equipment name is required');
      return;
    }
    setLoading(true);
    try {
      if (equipmentForm.id) {
        await updateEquipment(equipmentForm.id, equipmentForm);
        showNotice('success', lang === 'ar' ? 'تم تعديل المعدة' : 'Equipment updated');
      } else {
        await createEquipment(equipmentForm);
        showNotice('success', lang === 'ar' ? 'تمت إضافة المعدة' : 'Equipment added');
      }
      setShowEquipmentModal(false);
      await loadAll();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showNotice('error', err.message || (lang === 'ar' ? 'فشل حفظ المعدة' : 'Failed to save equipment'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEquipment = async (eq) => {
    const confirmPrompt = lang === 'ar' ? `هل تريد حذف "${eq.name}"؟` : `Delete "${eq.name}"?`;
    if (!window.confirm(confirmPrompt)) return;
    try {
      await deleteEquipment(eq.id);
      showNotice('success', lang === 'ar' ? 'تم حذف المعدة' : 'Equipment deleted');
      await loadAll();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showNotice('error', err.message || (lang === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
    }
  };

  const handleSingleUpload = async (file, onUploaded) => {
    setUploadingImage(true);
    try {
      const res = await uploadImageToGoogleDrive(file);
      onUploaded(res.imageUrl);
      showNotice('success', lang === 'ar' ? 'تم رفع الصورة عبر الوسيط Google Drive' : 'Uploaded image via Google Drive proxy');
    } catch (err) {
      showNotice('error', err.message || (lang === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload'));
    } finally {
      setUploadingImage(false);
    }
  };

  const activeProjectObj = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="admin-modal-overlay">
      <div className="admin-container">
        {/* Top Header */}
        <div className="admin-header">
          <div className="admin-title-box">
            <Camera size={26} className="text-gold" />
            <div>
              <h2>{t('admin_title')}</h2>
              <span className="admin-subtitle">
                {t('admin_sub')}
              </span>
            </div>
          </div>

          <div className="admin-top-actions">
            <button onClick={loadAll} className="btn-refresh" title={lang === 'ar' ? 'تحديث' : 'Refresh'}>
              <RefreshCw size={17} className={loading ? 'spin-icon' : ''} />
            </button>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="btn-admin-logout-top"
              title={t('logout')}
            >
              <LogOut size={16} />
              <span className="hide-on-mobile">{t('logout')}</span>
            </button>
            <button onClick={onClose} className="btn-admin-close" aria-label="Close">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {message && (
          <div className={`admin-alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {message.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="admin-nav-tabs">
          <button
            onClick={() => setActiveTab('projects')}
            className={`admin-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          >
            <FolderTree size={17} />
            <span>{t('tab_projects')} ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('images')}
            className={`admin-tab-btn ${activeTab === 'images' ? 'active' : ''}`}
          >
            <Images size={17} />
            <span>{t('tab_images')} ({projectImages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          >
            <FolderTree size={17} />
            <span>{t('tab_categories')} ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`admin-tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
          >
            <Camera size={17} />
            <span>{t('tab_equipment')} ({equipmentList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`admin-tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          >
            <Database size={17} />
            <span>{t('tab_status')}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="admin-content-body">
          {/* TAB 1: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="admin-panel animate-fade-in">
              <div className="panel-header-actions">
                <div>
                  <h3>{lang === 'ar' ? 'إدارة مشاريع التصوير (Projects)' : 'Manage Photography Projects'}</h3>
                  <p>{lang === 'ar' ? 'إضافة وتعديل المشاريع واختيار التصنيفات وصور الغلاف' : 'Add and edit projects, categories, and cover photos'}</p>
                </div>
                <button onClick={handleOpenNewProject} className="btn-gold">
                  <Plus size={16} />
                  <span>{t('add_project')}</span>
                </button>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>{t('cover_image')}</th>
                      <th>{t('project_name')}</th>
                      <th>{t('category')}</th>
                      <th>{t('tab_images')}</th>
                      <th>{t('created_at')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((proj) => (
                      <tr key={proj.id}>
                        <td>
                          <img
                            src={proj.cover_image || 'https://via.placeholder.com/60'}
                            alt={proj.name}
                            className="table-thumb"
                          />
                        </td>
                        <td className="font-semibold">{proj.name}</td>
                        <td>
                          <span className="badge-category">{proj.category_name}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setActiveProjectId(proj.id);
                              setActiveTab('images');
                            }}
                            className="btn-link-action"
                          >
                            <Images size={15} />
                            <span>{lang === 'ar' ? 'إدارة الصور' : 'Manage Photos'}</span>
                          </button>
                        </td>
                        <td className="text-muted">
                          {new Date(proj.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="table-actions-cell">
                            <button
                              onClick={() => handleEditProject(proj)}
                              className="btn-icon-action btn-edit"
                              title={t('edit')}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id, proj.name)}
                              className="btn-icon-action btn-delete"
                              title={t('delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-muted">
                          {lang === 'ar' ? 'لا توجد مشاريع مضافة حتى الآن.' : 'No projects found yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECT IMAGES */}
          {activeTab === 'images' && (
            <div className="admin-panel animate-fade-in">
              <div className="panel-header-actions">
                <div>
                  <h3>{lang === 'ar' ? 'إدارة صور المعرض (Project Images)' : 'Manage Project Images'}</h3>
                  <p>{lang === 'ar' ? 'رفع صور إضافية، حذف الصور، وتغيير ترتيب العرض (sort_order)' : 'Upload photos, delete photos, and reorder'}</p>
                </div>

                {/* Project Selector */}
                <div className="project-dropdown-filter">
                  <label>{t('active_project')}: </label>
                  <select
                    value={activeProjectId || ''}
                    onChange={(e) => setActiveProjectId(e.target.value)}
                    className="admin-select"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activeProjectObj && (
                <div className="active-project-bar">
                  <img
                    src={activeProjectObj.cover_image}
                    alt={activeProjectObj.name}
                    className="active-project-thumb"
                  />
                  <div>
                    <h4>{activeProjectObj.name}</h4>
                    <span className="text-muted">
                      {t('category')}: {activeProjectObj.category_name} | {lang === 'ar' ? 'عدد الصور' : 'Photos count'}:{' '}
                      {projectImages.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="image-upload-dropzone">
                <input
                  type="file"
                  id="multi-image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleUploadProjectImage}
                  disabled={uploadingImage || !activeProjectId}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="multi-image-upload"
                  className={`dropzone-label ${uploadingImage ? 'disabled' : ''}`}
                >
                  <Cloud size={38} className="text-gold" />
                  <span className="dropzone-title">
                    {uploadingImage
                      ? t('uploading')
                      : t('dropzone_multi_title')}
                  </span>
                  <span className="dropzone-subtitle">
                    {t('dropzone_multi_sub')}
                  </span>
                </label>
              </div>

              {/* Images Grid with Sort Order Controls */}
              <div className="project-images-grid">
                {projectImages.map((img, index) => (
                  <div key={img.id} className="admin-image-card">
                    <div className="image-card-preview">
                      <img src={img.image_url} alt={`Sort order ${img.sort_order}`} />
                      <span className="badge-sort-order">#{index + 1}</span>
                    </div>

                    <div className="image-card-controls">
                      <div className="sort-buttons">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveImage(index, 'up')}
                          className="btn-order-arrow"
                          title="Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          disabled={index === projectImages.length - 1}
                          onClick={() => handleMoveImage(index, 'down')}
                          className="btn-order-arrow"
                          title="Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="btn-delete-img"
                        title={t('delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {projectImages.length === 0 && (
                <div className="empty-images-state">
                  <Images size={40} className="text-muted" />
                  <p>{lang === 'ar' ? 'لا توجد صور فرعية مضافة لهذا المشروع بعد.' : 'No photos in this project gallery yet.'}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="admin-panel animate-fade-in">
              <div className="panel-header-actions">
                <div>
                  <h3>{lang === 'ar' ? 'إدارة التصنيفات (Categories)' : 'Manage Categories'}</h3>
                  <p>{lang === 'ar' ? 'إضافة وتعديل التصنيفات (Weddings, Portraits, Landscapes...)' : 'Add and manage categories'}</p>
                </div>
                <button
                  onClick={() => {
                    setCategoryForm({ id: null, name: '' });
                    setShowCategoryModal(true);
                  }}
                  className="btn-gold"
                >
                  <Plus size={16} />
                  <span>{t('add_category')}</span>
                </button>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>{t('category_name')}</th>
                      <th>{lang === 'ar' ? 'عدد المشاريع المرتبطة' : 'Linked Projects'}</th>
                      <th>{t('created_at')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const count = projects.filter((p) => p.category_id === cat.id).length;
                      return (
                        <tr key={cat.id}>
                          <td className="font-semibold">{cat.name}</td>
                          <td>
                            <span className="badge-count">{count} {lang === 'ar' ? 'مشاريع' : 'projects'}</span>
                          </td>
                          <td className="text-muted">
                            {new Date(cat.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="table-actions-cell">
                              <button
                                onClick={() => {
                                  setCategoryForm({ id: cat.id, name: cat.name });
                                  setShowCategoryModal(true);
                                }}
                                className="btn-icon-action btn-edit"
                                title={t('edit')}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="btn-icon-action btn-delete"
                                title={
                                  count > 0
                                    ? t('cannot_delete_cat_err')
                                    : t('delete')
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: EQUIPMENT */}
          {activeTab === 'equipment' && (
            <div className="admin-panel animate-fade-in">
              <div className="panel-header-actions">
                <div>
                  <h3>{lang === 'ar' ? 'إدارة معدات التصوير (Studio Gear)' : 'Manage Studio Gear'}</h3>
                  <p>{lang === 'ar' ? 'قائمة الكاميرات والعدسات ووحدات الإضاءة' : 'Studio camera bodies, prime lenses & lights'}</p>
                </div>
                <button
                  onClick={() => {
                    setEquipmentForm({ id: null, name: '', model: '', image_url: '' });
                    setShowEquipmentModal(true);
                  }}
                  className="btn-gold"
                >
                  <Plus size={16} />
                  <span>{t('add_equipment')}</span>
                </button>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>{t('cover_image')}</th>
                      <th>{t('equipment_name')}</th>
                      <th>{t('model_spec')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentList.map((eq) => (
                      <tr key={eq.id}>
                        <td>
                          <img
                            src={eq.image_url || 'https://via.placeholder.com/60'}
                            alt={eq.name}
                            className="table-thumb"
                          />
                        </td>
                        <td className="font-semibold">{eq.name}</td>
                        <td className="text-muted">{eq.model || '-'}</td>
                        <td>
                          <div className="table-actions-cell">
                            <button
                              onClick={() => {
                                setEquipmentForm({
                                  id: eq.id,
                                  name: eq.name,
                                  model: eq.model || '',
                                  image_url: eq.image_url || '',
                                });
                                setShowEquipmentModal(true);
                              }}
                              className="btn-icon-action btn-edit"
                              title={t('edit')}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteEquipment(eq)}
                              className="btn-icon-action btn-delete"
                              title={t('delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: STATUS & SYSTEM */}
          {activeTab === 'status' && (
            <div className="admin-panel animate-fade-in">
              <div className="status-grid">
                {/* Supabase Status Card */}
                <div className="status-card">
                  <div className="status-card-header">
                    <Database size={24} className="text-gold" />
                    <h4>{lang === 'ar' ? 'حالة قاعدة بيانات Supabase' : 'Supabase Database Status'}</h4>
                  </div>
                  <div className="status-indicator-row">
                    <span
                      className={`status-dot ${isSupabaseConfigured ? 'dot-green' : 'dot-amber'}`}
                    />
                    <span>
                      {isSupabaseConfigured
                        ? (lang === 'ar' ? 'متصل بقاعدة بيانات Supabase المباشرة' : 'Connected to live Supabase database')
                        : (lang === 'ar' ? 'وضع المعاينة والذاكرة المحلية (Local Cache Mode)' : 'Demo / Local Storage Cache Mode')}
                    </span>
                  </div>
                  <p className="status-desc">
                    {isSupabaseConfigured
                      ? (lang === 'ar' ? 'تم التعرف على مفاتيح Supabase البيئية بنجاح، ويتم حفظ القراءات والتعديلات مباشرة في السيرفر.' : 'Supabase credentials detected, all mutations save directly to PostgreSQL.')
                      : (lang === 'ar' ? 'لم يتم إدخال مفاتيح Supabase في ملف .env بعد، التطبيق يعمل بكفاءة عبر التخزين المحلي المؤقت (LocalStorage) والبيانات التجريبية.' : 'Supabase keys not yet set in .env. Operating smoothly with localStorage.')}
                  </p>
                  <div className="status-instruction">
                    <strong>SQL File:</strong> <code>supabase_schema.sql</code>
                  </div>
                </div>

                {/* Google Drive Status Card */}
                <div className="status-card">
                  <div className="status-card-header">
                    <Cloud size={24} className="text-gold" />
                    <h4>{lang === 'ar' ? 'وسيط رفع صور Google Drive (Netlify Function)' : 'Google Drive Proxy (Netlify Function)'}</h4>
                  </div>
                  <div className="status-indicator-row">
                    <span className="status-dot dot-green" />
                    <span>netlify/functions/upload-to-drive.js</span>
                  </div>
                  <p className="status-desc">
                    {lang === 'ar' 
                      ? 'الـ Frontend يرسل الصور المشفرة بصيغة Base64 إلى Netlify Function التي تستخدم صلاحيات Service Account لرفعها إلى مجلد Google Drive وحفظ الرابط في Supabase.'
                      : 'Frontend sends Base64 images to serverless Netlify function, which uploads securely to Google Drive API.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: PROJECT */}
        {showProjectModal && (
          <div className="sub-modal-backdrop">
            <div className="sub-modal-dialog">
              <div className="sub-modal-header">
                <h3>{projectForm.id ? t('edit_project') : t('add_project')}</h3>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="admin-form">
                <div className="form-group">
                  <label>{t('project_name')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ethan & Olivia Wedding"
                    value={projectForm.name}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, name: e.target.value })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="form-group">
                  <label>{t('category')} *</label>
                  <select
                    required
                    value={projectForm.category_id}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, category_id: e.target.value })
                    }
                    className="admin-select"
                  >
                    <option value="">-- {t('category')} --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('cover_image')} (Google Drive / Direct URL)</label>
                  <div className="cover-upload-flex">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={projectForm.cover_image}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, cover_image: e.target.value })
                      }
                      className="admin-input"
                    />
                    <label className="btn-upload-file">
                      <Upload size={16} />
                      <span>{uploadingImage ? t('uploading') : t('upload_file')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleSingleUpload(e.target.files[0], (url) =>
                              setProjectForm((prev) => ({ ...prev, cover_image: url }))
                            );
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  {projectForm.cover_image && (
                    <div className="preview-box">
                      <img src={projectForm.cover_image} alt="Cover Preview" />
                    </div>
                  )}
                </div>

                <div className="sub-modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="btn-outline-white"
                  >
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={loading} className="btn-gold">
                    {loading ? t('uploading') : t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CATEGORY */}
        {showCategoryModal && (
          <div className="sub-modal-backdrop">
            <div className="sub-modal-dialog">
              <div className="sub-modal-header">
                <h3>{categoryForm.id ? t('edit') : t('add_category')}</h3>
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="admin-form">
                <div className="form-group">
                  <label>{t('category_name')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Weddings, Portraits..."
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, name: e.target.value })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="sub-modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="btn-outline-white"
                  >
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={loading} className="btn-gold">
                    {loading ? t('uploading') : t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EQUIPMENT */}
        {showEquipmentModal && (
          <div className="sub-modal-backdrop">
            <div className="sub-modal-dialog">
              <div className="sub-modal-header">
                <h3>{equipmentForm.id ? t('edit') : t('add_equipment')}</h3>
                <button
                  onClick={() => setShowEquipmentModal(false)}
                  className="modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEquipment} className="admin-form">
                <div className="form-group">
                  <label>{t('equipment_name')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sony Alpha 1 Mirrorless"
                    value={equipmentForm.name}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, name: e.target.value })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="form-group">
                  <label>{t('model_spec')}</label>
                  <input
                    type="text"
                    placeholder="50.1MP Flagship / 8K Video"
                    value={equipmentForm.model}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, model: e.target.value })
                    }
                    className="admin-input"
                  />
                </div>

                <div className="form-group">
                  <label>{t('cover_image')} (Google Drive / Direct URL)</label>
                  <div className="cover-upload-flex">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={equipmentForm.image_url}
                      onChange={(e) =>
                        setEquipmentForm({ ...equipmentForm, image_url: e.target.value })
                      }
                      className="admin-input"
                    />
                    <label className="btn-upload-file">
                      <Upload size={16} />
                      <span>{uploadingImage ? t('uploading') : t('upload_file')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleSingleUpload(e.target.files[0], (url) =>
                              setEquipmentForm((prev) => ({ ...prev, image_url: url }))
                            );
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  {equipmentForm.image_url && (
                    <div className="preview-box">
                      <img src={equipmentForm.image_url} alt="Equipment Preview" />
                    </div>
                  )}
                </div>

                <div className="sub-modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowEquipmentModal(false)}
                    className="btn-outline-white"
                  >
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={loading} className="btn-gold">
                    {loading ? t('uploading') : t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
