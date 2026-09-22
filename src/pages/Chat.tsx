{/* Botão limpar conversa */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClearConversation}
          disabled={isClearing || isTyping}
          className="hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Iniciar novo atendimento"
        >
          {isClearing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </Button>

        {/* Botão áudio automático das respostas da ANIA */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleAutoSpeak}
          className="hover:bg-muted/50 transition-colors"
          title={autoSpeakEnabled ? 'Áudio automático ativado' : 'Áudio automático desativado'}
          aria-label={autoSpeakEnabled ? 'Áudio automático ativado' : 'Áudio automático desativado'}
          aria-pressed={autoSpeakEnabled}
        >
          {autoSpeakEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>

        {/* Link para ver produtos */}
        <Link to={vitrineLink} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
        </Link>
      </header>

      {/* Chat area - estilo WhatsApp */}
      <main className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {/* Galeria de imagens do produto - exibida quando há galeria */}
        {contextProduct?.image_url && (contextProduct.has_gallery && galleryImages.length > 0) && (
          <div className="mb-4">
            <ProductGalleryPreview
              coverImage={contextProduct.image_url}
              galleryImages={galleryImages}
              productName={contextProduct.name}
              onOpenGallery={handleOpenGallery}
            />
          </div>
        )}

        {messages.map((message, index) => {
          const isCatalog = message.content === CATALOG_MARKER;

          if (isCatalog) {
            return (
              <div
                key={message.id}
                className="flex justify-start animate-slide-up"
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div
                  className="max-w-[92%] w-full text-foreground rounded-2xl rounded-tl-md border border-border/20 p-2.5 shadow-sm relative bg-card"
                  style={chatCatalogCard ? { backgroundColor: chatCatalogCard } : undefined}
                >
                  <div
                    className="absolute top-0 -left-1.5 w-3 h-3 border-l border-t border-border/20 bg-card"
                    style={chatCatalogCard ? { backgroundColor: chatCatalogCard, clipPath: 'polygon(100% 0, 100% 100%, 0 0)' } : { clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
                  />
                  <div className="text-xs text-muted-foreground px-1 pb-1 font-medium">
                    🛍️ Catálogo
                  </div>
                  <CatalogCards
                    products={supabaseProducts.map(p => ({
                      id: p.id,
                      name: p.name,
                      price: Number(p.price),
                      image_url: p.image_url,
                      short_description: p.short_description,
                      payment_link: p.payment_link,
                      tenant_id: p.tenant_id,
                    }))}
                    slug={slug}
                  />
                  <span className="text-[10px] mt-1 block text-right text-muted-foreground">
                    {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <div
                className={`max-w-[80%] relative px-3 py-2 shadow-sm ${
                  message.sender === 'user'
                    ? 'text-white rounded-2xl rounded-tr-md'
                    : 'text-foreground rounded-2xl rounded-tl-md border border-border/20'
                }`}
                style={
                  message.sender === 'user'
                    ? { backgroundColor: chatUserBubble }
                    : chatAniaBubble ? { backgroundColor: chatAniaBubble } : undefined
                }
              >
                <div
                  className={`absolute top-0 w-3 h-3 ${
                    message.sender === 'user' ? '-right-1.5' : '-left-1.5 border-l border-t border-border/20'
                  }`}
                  style={{
                    backgroundColor:
                      message.sender === 'user' ? chatUserBubble : (chatAniaBubble || undefined),
                    clipPath: message.sender === 'user'
                      ? 'polygon(0 0, 100% 0, 0 100%)'
                      : 'polygon(100% 0, 100% 100%, 0 0)',
                  }}
                />

                <div className="text-[15px] leading-relaxed [&_a]:text-[var(--chat-link,inherit)]">
                  <MarkdownMessage content={message.content} />
                </div>
                {message.sender === 'bot' && (
                  <SpeakButton
                    messageId={message.id}
                    text={message.content}
                    voice={config?.assistant_voice}
                    instructions={config?.assistant_voice_style}
                    speed={config?.assistant_voice_speed}
                  />
                )}


                <span className={`text-[10px] mt-1 block text-right ${
                  message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-card border border-border/20 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm relative">
              <div 
                className="absolute top-0 -left-1.5 w-3 h-3 bg-card border-l border-t border-border/20"
                style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}
              />
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

      </main>

      {/* Footer - input premium ANIA */}
      <footer
        className="px-3 pt-4 pb-4 safe-bottom sticky bottom-0 backdrop-blur-xl border-t border-white/5"
        style={{
          background: 'linear-gradient(180deg, hsl(230 40% 10% / 0.4) 0%, hsl(230 45% 8% / 0.95) 60%)',
          boxShadow: '0 -8px 32px -8px hsl(230 50% 3% / 0.6)',
        }}
      >
        {voice.status !== 'idle' && (
          <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] text-foreground/90 border border-white/10"
            style={{ background: 'hsl(230 40% 12% / 0.9)' }}
          >
            {voice.status === 'recording' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="font-medium">Gravando {formatTimer(voice.seconds)}</span>
                <span className="text-muted-foreground text-[11px]">/ {formatTimer(voice.maxSeconds)}</span>
                <button
                  type="button"
                  onClick={voice.cancelRecording}
                  aria-label="Cancelar gravação"
                  title="Cancelar gravação"
                  className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="font-medium">Transcrevendo...</span>
              </>
            )}
          </div>
        )}
        <div className="flex gap-2.5 max-w-3xl mx-auto items-center">
          <div
            className="relative flex-1 rounded-full p-[1.5px] transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, hsl(190 100% 50% / 0.6) 0%, hsl(270 70% 60% / 0.6) 100%)',
              boxShadow: '0 4px 24px -6px hsl(270 70% 60% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.05)',
            }}
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={voice.status === 'recording' ? 'Gravando mensagem de voz...' : 'Digite sua mensagem para a ANIA...'}
              disabled={isTyping}
              className="flex-1 h-14 w-full rounded-full border-0 pl-5 pr-14 text-[15px] text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
              style={{ backgroundColor: chatInputBg || 'hsl(230 40% 10% / 0.95)' }}
            />
            {voice.isSupported && (
              <button
                type="button"
                onClick={voice.status === 'recording' ? voice.stopRecording : voice.startRecording}
                disabled={isTyping || voice.status === 'transcribing'}
                aria-label={voice.status === 'recording' ? 'Parar gravação' : 'Gravar mensagem de voz'}
                title={voice.status === 'recording' ? 'Parar gravação' : 'Gravar mensagem de voz'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-50"
                style={{
                  background: voice.status === 'recording' ? 'hsl(0 80% 55% / 0.2)' : 'transparent',
                  color: voice.status === 'recording' ? 'hsl(0 85% 65%)' : undefined,
                }}
              >
                {voice.status === 'transcribing' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : voice.status === 'recording' ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Mic className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            size="icon"
            className="w-14 h-14 rounded-full text-white shadow-lg transition-all duration-200 active:scale-90 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 border-0 shrink-0"
            style={{
              background: chatSendColor.includes('gradient')
                ? chatSendColor
                : `linear-gradient(135deg, ${chatSendColor} 0%, ${chatSendColor} 100%)`,
              boxShadow: `0 0 24px ${chatSendColor}80, 0 4px 16px ${chatSendColor}55, inset 0 1px 0 hsl(0 0% 100% / 0.2)`,
            }}
          >
            <Send className="w-6 h-6 -ml-0.5" />
          </Button>
        </div>
      </footer>

      {/* Modal da galeria de imagens */}
      {contextProduct?.image_url && (
        <ProductGalleryViewer
          coverImage={contextProduct.image_url}
          galleryImages={galleryImages}
          productName={contextProduct.name}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          initialIndex={galleryInitialIndex}
        />
      )}
      </div>
    </div>
  );
}
