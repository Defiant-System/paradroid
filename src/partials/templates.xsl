<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template name="circuit-board-left">
		<svg viewBox="0 0 277 292">
			<xsl:for-each select="./*">
				<xsl:variable name="pos" select="position()"/>
				<g>
					<xsl:attribute name="transform">translate(33, <xsl:value-of select="14 + ($pos * 22)" />)</xsl:attribute>
					<xsl:choose>
						<xsl:when test="@group = 'short-1'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<circle class="void" cx="45" cy="0" r="5"/>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3"/>
						</xsl:when>
						<xsl:when test="@group = 'short-2'">
							<circle class="void" cx="185" cy="0" r="5"/>
							<line class="line" x1="190" y1="0" x2="234" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'short-3'">
							<polygon class="stopper" points="37,0 48,-5 52,-5 52,5 48,5"/>
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'short-4'">
							<polygon class="stopper" points="178,-5 183,-5 192,0 183,5 178,5"/>
							<line class="line" x1="190" y1="0" x2="234" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'short-5'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="40" y2="0"/>
							<line class="line disconnected" x1="190" y1="0" x2="234" y2="0"/>
							<circle class="void" cx="45" cy="0" r="5"/>
							<circle class="void disconnected" cx="185" cy="0" r="5"/>
							<rect class="socket disconnected" x="233" y="-5" width="13" height="9" rx="3"/>
						</xsl:when>
						<xsl:when test="@group = 'short-6'">
							<line class="line" x1="0" y1="0" x2="40" y2="0"/>
							<polygon class="stopper" points="37,0 48,-5 52,-5 52,5 48,5"/>
							<polygon class="stopper" points="178,-5 183,-5 192,0 183,5 178,5"/>
							<line class="line" x1="190" y1="0" x2="234" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'repeater-1'">
							<line class="line" x1="0" y1="0" x2="158" y2="0"/>
							<polygon class="repeater" points="158,-7 163,-7 175,0 163,7 158,7"/>
							<line class="line" x1="173" y1="0" x2="234" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'repeater-2'">
							<line class="line" x1="0" y1="0" x2="58" y2="0"/>
							<polygon class="repeater" points="58,-7 63,-7 75,0 63,7 58,7"/>
							<line class="line" x1="73" y1="0" x2="234" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'join-1'">
							<line class="line" x1="0" y1="0" x2="105" y2="0"/>
							<circle class="diode" cx="105" cy="0" r="5"/>
							<polyline class="line" points="0,-22 144,-22 169,-2, 178,-2" />
							<polyline class="line" points="0,22 144,22 169,2, 178,2" />
							<rect class="chip" x="178" y="-7" width="14" height="14"/>
							<line class="line" x1="192" y1="0" x2="233" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'join-2'">
							<polyline class="line" points="0,-22 144,-22 170,-4 179,-4" />
							<line class="line" x1="0" y1="0" x2="178" y2="0"/>
							<rect class="chip" x="178" y="-9" width="14" height="14"/>
							<line class="line" x1="192" y1="0" x2="233" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'join-3'">
							<line class="line" x1="0" y1="0" x2="178" y2="0"/>
							<polyline class="line" points="0,22 144,22 170,4 179,4" />
							<rect class="chip" x="178" y="-5" width="14" height="14"/>
							<line class="line" x1="192" y1="0" x2="233" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'split-join'">
							<line class="line" x1="0" y1="0" x2="38" y2="0"/>
							<rect class="chip" x="38" y="-7" width="14" height="14"/>
							<polyline class="line" points="52,-2 60,-2 85,-22, 144,-22, 169,-2, 178,-2" />
							<polyline class="line" points="52,2 60,2 85,22, 144,22, 169,2, 178,2" />
							<rect class="chip" x="178" y="-7" width="14" height="14"/>
							<line class="line" x1="192" y1="0" x2="233" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'split-1'">
							<line class="line" x1="0" y1="0" x2="38" y2="0"/>
							<rect class="chip" x="38" y="-7" width="14" height="14"/>
							<polyline class="line" points="52,-2 60,-2 85,-22, 233,-22" />
							<polyline class="line" points="52,2 60,2 85,22, 233,22" />
							<polygon class="gpu" points="128,-7 138,-7 138,7 123,7 123,-2"/>
							<line class="line" x1="138" y1="0" x2="233" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'split-2'">
							<line class="line" x1="0" y1="0" x2="38" y2="0"/>
							<rect class="chip" x="38" y="-5" width="14" height="14"/>
							<line class="line" x1="52" y1="0" x2="233" y2="0"/>
							<polyline class="line" points="52,4 60,4 85,22, 144,22 233,22" />
						</xsl:when>
						<xsl:when test="@group = 'split-3'">
							<line class="line" x1="0" y1="0" x2="38" y2="0"/>
							<rect class="chip" x="38" y="-9" width="14" height="14"/>
							<line class="line" x1="52" y1="0" x2="233" y2="0"/>
							<polyline class="line" points="52,-4 60,-4 85,-22, 144,-22 233,-22" />
						</xsl:when>
						<xsl:when test="@group = 'switch-1'">
							<polyline class="line" points="0,0 80,0 105,-22, 164,-22 233,-22" />
							<circle class="void" cx="138" cy="0" r="5"/>
							<line class="line" x1="142" y1="0" x2="233" y2="0"/>
						</xsl:when>
						<xsl:when test="@group = 'switch-2'">
							<polyline class="line" points="0,0 80,0 105,22, 164,22 233,22" />
							<circle class="void" cx="138" cy="0" r="5"/>
							<line class="line" x1="142" y1="0" x2="233" y2="0"/>
						</xsl:when>
						<xsl:otherwise>
							<line class="line" x1="0" y1="0" x2="234" y2="0"/>
							<line class="line stream" x1="0" y1="0" x2="234" y2="0"/>
							<rect class="socket" x="233" y="-5" width="13" height="9" rx="3"/>
						</xsl:otherwise>
					</xsl:choose>
					<circle class="switch" cx="-5" cy="0" r="5"/>
				</g>
			</xsl:for-each>
		</svg>
	</xsl:template>

	<xsl:template name="circuit-board-right">
		<svg viewBox="0 0 277 292">
			<xsl:for-each select="./*">
				<xsl:variable name="pos" select="position()"/>
				<g>
					<xsl:attribute name="transform">translate(-3, <xsl:value-of select="14 + ($pos * 22)" />)</xsl:attribute>
					<rect class="socket" x="0" y="-5" width="13" height="9" rx="3"/>
					<line class="line" x1="13" y1="0" x2="247" y2="0"/>
					<circle class="switch" cx="253" cy="0" r="5"/>
				</g>
			</xsl:for-each>
		</svg>
	</xsl:template>

	<xsl:template name="layer-background">
		<div class="layer-background" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='background']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-collision">
		<div class="layer-collision" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='collision']/*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
					<xsl:attribute name="style">
						--x: <xsl:value-of select="@x" />px;
						--y: <xsl:value-of select="@y" />px;
						<xsl:if test="@w">--w: <xsl:value-of select="@w" />px;</xsl:if>
						<xsl:if test="@h">--h: <xsl:value-of select="@h" />px;</xsl:if>
					</xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-action">
		<div class="layer-action" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='action']/*">
				<b>
					<xsl:attribute name="class">a1</xsl:attribute>
					<xsl:attribute name="style">
						<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
						<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
						<xsl:if test="@w">--w: <xsl:value-of select="@w" />;</xsl:if>
						<xsl:if test="@h">--h: <xsl:value-of select="@h" />;</xsl:if>
					</xsl:attribute>
					<xsl:attribute name="data-action"><xsl:value-of select="@action" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-los">
		<div class="layer-los" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<!-- walls -->
			<xsl:for-each select="./Layer[@id='los']/walls">
				<xsl:variable name="pos" select="position()"/>
				<xsl:for-each select="./*">
					<div class="segment">
						<xsl:attribute name="data-group"><xsl:value-of select="$pos" /></xsl:attribute>
						<xsl:if test="position() = 1"><xsl:attribute name="data-type">start</xsl:attribute></xsl:if>
						<xsl:if test="position() > 1 and @x = ../*[position() = 1]/@x and @y = ../*[position() = 1]/@y"><xsl:attribute name="data-type">end</xsl:attribute></xsl:if>
						<xsl:attribute name="style">
							--sx: <xsl:value-of select="@x" />;
							--sy: <xsl:value-of select="@y" />;
							<xsl:if test="@w">--sw: <xsl:value-of select="@w" />;</xsl:if>
							<xsl:if test="@h">--sh: <xsl:value-of select="@h" />;</xsl:if>
							<xsl:if test="@d = '.5' or @d = '1.5'">--sa: <xsl:value-of select="@d" />;</xsl:if>
						</xsl:attribute>
					</div>
				</xsl:for-each>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-lights">
		<div class="layer-lights hide-helpers" data-click="put-tile">
			<xsl:attribute name="data-level"><xsl:value-of select="@id" /></xsl:attribute>
			<xsl:attribute name="style">
				--w: <xsl:value-of select="@width" />;
				--h: <xsl:value-of select="@height" />;
				<xsl:if test="@x">--x: <xsl:value-of select="@x" />;</xsl:if>
				<xsl:if test="@y">--y: <xsl:value-of select="@y" />;</xsl:if>
			</xsl:attribute>
			<xsl:for-each select="./Layer[@id='lights']/*">
				<div class="spotlight">
					<!-- <xsl:if test="position() = 1"><xsl:attribute name="class">spotlight active</xsl:attribute></xsl:if> -->
					<xsl:attribute name="style">
						--x: <xsl:value-of select="@x" />;
						--y: <xsl:value-of select="@y" />;
						--r: <xsl:value-of select="@r" />;
					</xsl:attribute>
					<span class="handle"></span>
				</div>
			</xsl:for-each>
		</div>
	</xsl:template>

	<xsl:template name="layer-droids">
		<div class="layer-droids" data-click="put-tile">
			
		</div>
	</xsl:template>

</xsl:stylesheet>